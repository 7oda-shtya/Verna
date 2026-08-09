export const REPUTATION_WINDOW_DAYS = 30
export const BAN_SCORE_THRESHOLD = 30
export const BAN_DURATION_DAYS = 3
export const RAPID_CANCEL_LIMIT = 5
export const RAPID_CANCEL_WINDOW_DAYS = 7
export const RAPID_CANCEL_BAN_HOURS = 48

const DAY_MS = 24 * 60 * 60 * 1000

const countRecent = (events, now) => {
	if (typeof events === 'number') return Math.max(0, events)
	if (!Array.isArray(events)) return 0
	const windowStart = now.getTime() - REPUTATION_WINDOW_DAYS * DAY_MS
	return events.filter(event => {
		const value = event?.completedAt || event?.cancelledAt || event?.createdAt || event
		const time = new Date(value).getTime()
		return Number.isFinite(time) && time >= windowStart && time <= now.getTime()
	}).length
}

export const getReputationColorKey = score => {
	if (score == null) return 'textMuted'
	if (score >= 70) return 'success'
	if (score >= 30) return 'warning'
	return 'error'
}

export const calculateReputation = ({ completedTrips = 0, cancelledTrips = 0, acceptedReports = 0, now = new Date() }) => {
	const completedCount = countRecent(completedTrips, now)
	const cancelledCount = countRecent(cancelledTrips, now)
	const acceptedReportCount = countRecent(acceptedReports, now)
	const totalTrips = completedCount + cancelledCount

	const score = Math.max(0, Math.min(100, 100 - cancelledCount * 2 - acceptedReportCount * 10))
	let label
	if (score >= 90) label = 'سمعة ممتازة'
	else if (score >= 70) label = 'سمعة جيدة'
	else if (score >= 50) label = 'سمعة متوسطة'
	else if (score >= 30) label = 'سمعة تحتاج تحسين'
	else label = 'سمعة ضعيفة'

	return { score, label, colorKey: getReputationColorKey(score), isNew: false, totalTrips }
}

export const getStoredReputation = user => {
	const score = user?.reputationScore == null ? 100 : Number(user.reputationScore)
	return {
		score,
		label: user?.reputationLabel || 'سمعة ممتازة',
		colorKey: getReputationColorKey(score),
		isNew: false,
		completedTrips: Number(user?.reputationCompletedTrips) || 0,
		cancelledTrips: Number(user?.reputationCancelledTrips) || 0,
		acceptedReports: Number(user?.reputationAcceptedReports) || 0,
	}
}

export const getBanReasonText = reason => {
	if (reason === 'REPUTATION_AND_RAPID_CANCELLATION') return 'انخفاض تقييم السمعة وإلغاء عدد كبير من الرحلات خلال فترة قصيرة'
	if (reason === 'RAPID_CANCELLATION') return 'إلغاء عدد كبير من الرحلات خلال فترة قصيرة'
	return 'انخفاض تقييم السمعة'
}
