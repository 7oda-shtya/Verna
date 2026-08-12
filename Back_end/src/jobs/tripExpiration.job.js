import cron from 'node-cron';
import { prisma } from '../db.js';
import { sendNotification } from '../services/notification.service.js';
import { recalculateUserReputation } from '../services/reputation.service.js';
import { emitToOnlineDrivers } from '../socket/index.js';

const STALE_PENDING_MINUTES = 15;
const SCHEDULED_PENDING_MINUTES = 60;
const SCHEDULED_BOOKED_GRACE_MINUTES = 60;

const cancelPendingTrips = async (trips, message) => {
  if (!trips.length) return [];
  const tripIds = trips.map(trip => trip.id);
  const cancelledAt = new Date();
  await prisma.$transaction([
    prisma.offer.updateMany({
      where: { tripId: { in: tripIds }, status: { in: ['PENDING', 'ACCEPTED'] } },
      data: { status: 'CANCELLED' },
    }),
    prisma.trip.updateMany({
      where: { id: { in: tripIds }, status: 'PENDING' },
      data: { status: 'CANCELLED', cancelledAt },
    }),
  ]);
  await Promise.allSettled(trips.map(trip => sendNotification({
    userId: trip.clientId,
    title: 'انتهت صلاحية طلب الرحلة',
    body: message,
    type: 'TRIP_STATUS',
    data: { tripId: trip.id, status: 'CANCELLED' },
  })));
  trips.forEach(trip => emitToOnlineDrivers('ride:cancelled', { tripId: trip.id }));
  return tripIds;
};

export const expireTrips = async (now = new Date()) => {
  const immediateThreshold = new Date(now.getTime() - STALE_PENDING_MINUTES * 60 * 1000);
  const scheduledPendingThreshold = new Date(now.getTime() - SCHEDULED_PENDING_MINUTES * 60 * 1000);
  const scheduledBookedThreshold = new Date(now.getTime() - SCHEDULED_BOOKED_GRACE_MINUTES * 60 * 1000);

  const [staleImmediateTrips, staleScheduledPendingTrips, missedScheduledTrips] = await Promise.all([
    prisma.trip.findMany({
      where: { status: 'PENDING', scheduledTime: null, createdAt: { lt: immediateThreshold } },
      select: { id: true, clientId: true },
    }),
    prisma.trip.findMany({
      where: { status: 'PENDING', scheduledTime: { not: null }, createdAt: { lt: scheduledPendingThreshold } },
      select: { id: true, clientId: true },
    }),
    prisma.trip.findMany({
      where: { status: 'BOOKED', scheduledTime: { lt: scheduledBookedThreshold } },
      select: { id: true, clientId: true, driverId: true },
    }),
  ]);

  await cancelPendingTrips(
    staleImmediateTrips,
    'لم يقدّم أي سائق عرضًا خلال 15 دقيقة، لذلك أُلغي الطلب تلقائيًا. يمكنك طلب رحلة جديدة.',
  );
  await cancelPendingTrips(
    staleScheduledPendingTrips,
    'لم يقدّم أي سائق عرضًا خلال ساعة من طلب الرحلة المجدولة، لذلك أُلغي الطلب تلقائيًا.',
  );

  const cancelledAt = new Date();
  const missedDriverIds = [];
  for (const trip of missedScheduledTrips) {
    if (!trip.driverId) continue;
    // Guard the update so a driver starting at the same time cannot have their trip cancelled
    // based on the earlier read.
    const cancelled = await prisma.$transaction(async tx => {
      const result = await tx.trip.updateMany({
        where: { id: trip.id, status: 'BOOKED' },
        data: {
          status: 'CANCELLED',
          cancelledAt,
          driverCancelledAt: cancelledAt,
          cancelledByDriverId: trip.driverId,
        },
      });
      if (!result.count) return false;
      await tx.offer.updateMany({ where: { tripId: trip.id, status: 'ACCEPTED' }, data: { status: 'CANCELLED' } });
      return true;
    });
    if (!cancelled) continue;
    missedDriverIds.push(trip.driverId);
    await Promise.allSettled([
      sendNotification({
        userId: trip.clientId,
        title: 'أُلغي موعد الرحلة',
        body: 'لم يبدأ السائق الرحلة خلال ساعة من موعدها، لذلك أُلغيت تلقائيًا.',
        type: 'TRIP_STATUS',
        data: { tripId: trip.id, status: 'CANCELLED' },
      }),
      sendNotification({
        userId: trip.driverId,
        title: 'أُلغي موعد الرحلة',
        body: 'لم تبدأ الرحلة خلال ساعة من موعدها، لذلك أُلغيت وسُجلت كإلغاء من السائق.',
        type: 'TRIP_STATUS',
        data: { tripId: trip.id, status: 'CANCELLED' },
      }),
    ]);
  }
  await Promise.allSettled(missedDriverIds.map(driverId => recalculateUserReputation(driverId, cancelledAt)));

  const total = staleImmediateTrips.length + staleScheduledPendingTrips.length + missedDriverIds.length;
  if (total) console.log(`تم إلغاء ${total} رحلة منتهية الصلاحية تلقائيًا.`);
  return { immediate: staleImmediateTrips.length, scheduledPending: staleScheduledPendingTrips.length, scheduledBooked: missedDriverIds.length };
};

cron.schedule('*/5 * * * *', () => {
  expireTrips().catch(error => console.error('تعذر إلغاء الرحلات منتهية الصلاحية:', error));
}, { timezone: 'Africa/Cairo' });
