import { prisma } from '../db.js';
import ApiError from '../utils/ApiError.js';

export const REPUTATION_WINDOW_DAYS = 30;
export const BAN_SCORE_THRESHOLD = 30;
export const BAN_DURATION_DAYS = 3;
export const RAPID_CANCEL_LIMIT = 5;
export const RAPID_CANCEL_WINDOW_DAYS = 7;
export const RAPID_CANCEL_BAN_HOURS = 48;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const getLabel = score => {
  if (score == null) return 'مستخدم جديد';
  if (score >= 90) return 'سمعة ممتازة';
  if (score >= 70) return 'سمعة جيدة';
  if (score >= 50) return 'سمعة متوسطة';
  if (score >= 30) return 'سمعة تحتاج تحسين';
  return 'سمعة ضعيفة';
};

export const calculateReputationScore = ({ completedTrips = 0, cancelledTrips = 0, acceptedReports = 0 }) => {
  const score = Math.max(0, Math.min(100, 100 - cancelledTrips * 2 - acceptedReports * 10));
  return { score, label: getLabel(score) };
};

const activeDate = (date, now) => date && new Date(date) > now;

const getBanSnapshot = (user, now = new Date()) => {
  const reputationActive = activeDate(user.reputationBanEndAt, now);
  const rapidCancellationActive = activeDate(user.rapidCancelBanEndAt, now);
  const endDates = [
    reputationActive ? new Date(user.reputationBanEndAt) : null,
    rapidCancellationActive ? new Date(user.rapidCancelBanEndAt) : null,
  ].filter(Boolean);
  const banReason = reputationActive && rapidCancellationActive
    ? 'REPUTATION_AND_RAPID_CANCELLATION'
    : reputationActive
      ? 'REPUTATION'
      : rapidCancellationActive
        ? 'RAPID_CANCELLATION'
        : null;

  return {
    isBanned: endDates.length > 0,
    banReason,
    banEndAt: endDates.length ? new Date(Math.max(...endDates.map(date => date.getTime()))) : null,
    reputationBanActive: reputationActive,
    rapidCancellationBanActive: rapidCancellationActive,
  };
};

export const refreshUserBanState = async (userId, now = new Date()) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const snapshot = getBanSnapshot(user, now);
  const banStartAt = snapshot.isBanned ? (user.banStartAt || now) : null;

  return prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: snapshot.isBanned,
      banReason: snapshot.banReason,
      banStartAt,
      banEndAt: snapshot.banEndAt,
      reputationBanEndAt: snapshot.reputationBanActive ? user.reputationBanEndAt : null,
      rapidCancelBanEndAt: snapshot.rapidCancellationBanActive ? user.rapidCancelBanEndAt : null,
    },
  });
};

export const recalculateUserReputation = async (userId, now = new Date()) => {
  const windowStart = new Date(now.getTime() - REPUTATION_WINDOW_DAYS * DAY_MS);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, reputationScore: true, reputationBanEndAt: true } });
  if (!user) return null;
  const tripOwner = user.role === 'DRIVER' ? { driverId: userId } : { clientId: userId };
  const [completedTrips, cancelledTrips, acceptedReports] = await Promise.all([
    prisma.trip.count({
      where: {
        ...tripOwner,
        status: 'COMPLETED',
        OR: [{ completedAt: { gte: windowStart } }, { completedAt: null, createdAt: { gte: windowStart } }],
      },
    }),
    prisma.trip.count({
      where: {
        ...(user.role === 'DRIVER' ? { cancelledByDriverId: userId } : { clientId: userId, status: 'CANCELLED' }),
        OR: user.role === 'DRIVER'
          ? [{ driverCancelledAt: { gte: windowStart } }]
          : [{ cancelledAt: { gte: windowStart } }, { cancelledAt: null, createdAt: { gte: windowStart } }],
      },
    }),
    prisma.report.count({
      where: {
        reportedId: userId,
        status: 'ACCEPTED',
        OR: [{ reviewedAt: { gte: windowStart } }, { reviewedAt: null, createdAt: { gte: windowStart } }],
      },
    }),
  ]);

  const reputation = calculateReputationScore({ completedTrips, cancelledTrips, acceptedReports });
  const reachedLowScore = reputation.score != null
    && reputation.score < BAN_SCORE_THRESHOLD
    && (user.reputationScore == null || user.reputationScore >= BAN_SCORE_THRESHOLD);
  const reputationBanEndAt = reachedLowScore
    ? new Date(now.getTime() + BAN_DURATION_DAYS * DAY_MS)
    : user.reputationBanEndAt;

  await prisma.user.update({
    where: { id: userId },
    data: {
      reputationScore: reputation.score,
      reputationLabel: reputation.label,
      reputationUpdatedAt: now,
      reputationCompletedTrips: completedTrips,
      reputationCancelledTrips: cancelledTrips,
      reputationDriverCancelledTrips: user.role === 'DRIVER' ? cancelledTrips : 0,
      reputationAcceptedReports: acceptedReports,
      reputationBanEndAt,
    },
  });

  return refreshUserBanState(userId, now);
};

export const recalculateReputationScores = async (now = new Date()) => {
  const users = await prisma.user.findMany({ where: { role: { in: ['CLIENT', 'DRIVER'] } }, select: { id: true } });
  for (const user of users) await recalculateUserReputation(user.id, now);
  return users.length;
};

export const applyClientCancellationConsequences = async (userId, cancelledAt = new Date()) => {
  await recalculateUserReputation(userId, cancelledAt);
  return evaluateRapidCancellationBan(userId, cancelledAt);
};

export const evaluateRapidCancellationBan = async (userId, now = new Date()) => {
  const windowStart = new Date(now.getTime() - RAPID_CANCEL_WINDOW_DAYS * DAY_MS);
  const cancellationCount = await prisma.trip.count({
    where: { clientId: userId, status: 'CANCELLED', cancelledAt: { gte: windowStart } },
  });

  if (cancellationCount > RAPID_CANCEL_LIMIT) {
    await prisma.user.update({
      where: { id: userId },
      data: { rapidCancelBanEndAt: new Date(now.getTime() + RAPID_CANCEL_BAN_HOURS * HOUR_MS) },
    });
  }

  return refreshUserBanState(userId, now);
};

export const assertUserCanRequestTrip = async userId => {
  const user = await refreshUserBanState(userId);
  if (user?.isBanned && user.banEndAt) {
    throw new ApiError(403, 'حسابك موقوف مؤقتًا ولا يمكنك طلب رحلة جديدة حاليًا', 'TEMPORARY_BAN', {
      banReason: user.banReason,
      banEndAt: user.banEndAt,
    });
  }
  return user;
};
