import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { sendNotification } from '../../services/notification.service.js';
import { recalculateUserReputation } from '../../services/reputation.service.js';
import { emitToOnlineDrivers, emitToUser } from '../../socket/index.js';
import { issueCoupon } from '../../services/coupon.service.js';

const rideFeedPayload = trip => ({
	id: trip.id,
	startName: trip.startName,
	endName: trip.endName,
	ridersCount: trip.ridersCount,
	customerNote: trip.customerNote,
	price: trip.price,
	scheduledTime: trip.scheduledTime,
});

const driverId = (req) => req.user.id;

export const makeOffer = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const { price, timeToReach, startTime, note } = req.body;

	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة مش موجودة');
	if (trip.status !== 'PENDING') {
		throw new ApiError(400, 'الرحلة دي مش متاحة للعروض');
	}

	const activeTrips = await prisma.trip.findMany({
		where: { driverId: driverId(req), status: { in: ['STARTED', 'BOOKED'] } },
	});

	if (activeTrips.length > 0) {
		const car = await prisma.car.findUnique({ where: { driverId: driverId(req) } });
		const usedSeats = activeTrips.reduce((sum, t) => sum + t.ridersCount, 0);

		if (usedSeats + trip.ridersCount > car.seats) {
			throw new ApiError(400, 'مفيش أماكن كافية في العربية');
		}
	}

	const offer = await prisma.offer.create({
		data: { driverId: driverId(req), tripId, price, timeToReach, startTime, note },
	});

	// The client has no other way to learn a new offer exists — RequestTrip/Home only show the
	// PENDING trip card, they don't poll for offers, so without this the Offers screen is a dead end.
	await sendNotification({
		userId: trip.clientId,
		title: 'عرض جديد على رحلتك',
		body: `سائق قدّم عرض بسعر ${price} ج.م`,
		type: 'NEW_OFFER',
		data: { tripId, offerId: offer.id },
	});
	emitToUser(trip.clientId, 'offer:new', { tripId, offerId: offer.id });

	if(activeTrips) res.status(200).json({ success: true, data: {offer, trips: activeTrips} });
	else res.status(201).json({ success: true, data: offer });
});


export const getTrips = catchAsync(async (req, res) => {
	const driver = await prisma.user.findUnique({ where: { id: driverId(req) }, select: { isOnline: true } });
	if (!driver?.isOnline) return res.status(200).json({ success: true, data: [] });
	const car = await prisma.car.findUnique({ where: { driverId: driverId(req) } });
	const { seats } = car;

	const currentTrip = await prisma.trip.findFirst({
		where: {
			driverId: driverId(req),
			status: { in: ['STARTED', 'BOOKED'] }
		}
	});
	let availableSeats = seats;
	if (currentTrip) {
		const { ridersCount, route, scheduledTime } = currentTrip;
		availableSeats = seats - ridersCount;
	} else { availableSeats = seats; }
	if (availableSeats <= 0) {
		return res.status(200).json({ success: true, data: [] });
	}

	const trips = await prisma.trip.findMany({
		where: {
			status: 'PENDING',
			ridersCount: { lte: availableSeats },
			offers: { none: { driverId: driverId(req) } }
		},
		orderBy: { scheduledTime: 'asc' },
	});
	res.status(200).json({ success: true, data: trips });
})


export const cancelOffer = catchAsync(async (req, res) => {
	const { offerId } = req.params;

	const offer = await prisma.offer.findUnique({
		where: { id: offerId },
		include: { trip: true },
	});
	if (!offer) throw new ApiError(404, 'العرض مش موجود');
	if (offer.driverId !== driverId(req)) {
		throw new ApiError(403, 'مش مسموحلك تلفي العرض ده');
	}
	if (offer.trip.status !== 'PENDING') {
		throw new ApiError(400, 'الرحلة دي اتقفلت أو اتقبل فيها عرض قبل كده');
	}
	if (offer.status !== 'PENDING') {
		throw new ApiError(400, 'العرض ده اتقبل أو اتلغى قبل كده، مينفعش تلغيه');
	}

	await prisma.offer.update({
		where: { id: offerId },
		data: { status: 'CANCELLED' }
	});
	res.status(200).json({ success: true });
})

export const startTrip = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة غير موجودة');
	if (trip.driverId !== driverId(req)) throw new ApiError(403, 'غير مسموح لك ببدء هذه الرحلة');
	if (trip.status !== 'BOOKED') throw new ApiError(400, 'لا يمكن بدء الرحلة في حالتها الحالية');

	const startedAt = new Date();
	const updatedTrip = await prisma.trip.update({ where: { id: tripId }, data: { status: 'STARTED', startedAt } });
	await sendNotification({ userId: trip.clientId, title: 'بدأت الرحلة', body: 'بدأ السائق الرحلة.', type: 'TRIP_STATUS', data: { tripId, status: 'STARTED' } });
	res.status(200).json({ success: true, data: updatedTrip });
});

export const cancelBookedTrip = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const currentDriverId = driverId(req);
	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة غير موجودة');
	if (trip.driverId !== currentDriverId) throw new ApiError(403, 'غير مسموح لك بإلغاء هذه الرحلة');
	if (trip.status !== 'BOOKED') throw new ApiError(400, 'يمكن إلغاء الرحلة فقط قبل بدئها');

	const cancelledAt = new Date();
	const updatedTrip = await prisma.$transaction(async tx => {
		await tx.offer.updateMany({ where: { tripId, driverId: currentDriverId }, data: { status: 'CANCELLED' } });
		return tx.trip.update({
			where: { id: tripId },
			data: { status: 'PENDING', driverId: null, price: 0, driverCancelledAt: cancelledAt, cancelledByDriverId: currentDriverId },
		});
	});
	await recalculateUserReputation(currentDriverId, cancelledAt);
	await sendNotification({ userId: trip.clientId, title: 'تم إلغاء الرحلة', body: 'ألغى السائق الرحلة وستعود طلبات العروض.', type: 'TRIP_STATUS', data: { tripId, status: 'CANCELLED_BY_DRIVER' } });
	emitToOnlineDrivers('ride:new', rideFeedPayload(updatedTrip));
	res.status(200).json({ success: true, data: updatedTrip });
});

export const endTrip = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const currentDriverId = driverId(req);
	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة غير موجودة');
	if (trip.driverId !== currentDriverId) throw new ApiError(403, 'غير مسموح لك بإنهاء هذه الرحلة');
	if (trip.status === 'COMPLETED') return res.status(200).json({ success: true, message: 'الرحلة انتهت بالفعل' });
	if (!['BOOKED', 'STARTED'].includes(trip.status)) throw new ApiError(400, 'لا يمكن إنهاء الرحلة في حالتها الحالية');

	const completedAt = new Date();
	const forceCash = req.body?.resolution === 'CASH';

	if (trip.paymentMethod === 'WALLET' && forceCash) {
		// Driver's explicit override after an INSUFFICIENT_WALLET_BALANCE response: collect cash
		// physically instead, no wallet transfer, trip still completes.
		await prisma.trip.update({ where: { id: tripId }, data: { status: 'COMPLETED', completedAt, paymentMethod: 'CASH' } });
	} else if (trip.paymentMethod === 'WALLET') {
		// Deduct from the client and credit the driver atomically with the COMPLETED transition,
		// so a payment failure can never leave a trip half-completed or money in limbo.
		const client = await prisma.user.findUnique({ where: { id: trip.clientId }, select: { wallet: true } });
		const walletBalance = client?.wallet ?? 0;
		if (walletBalance < trip.price) {
			throw new ApiError(409, 'رصيد العميل في المحفظة غير كافٍ لإتمام الدفع. يمكنك تحصيل المبلغ نقدًا بدلاً من ذلك.', 'INSUFFICIENT_WALLET_BALANCE', {
				walletBalance,
				price: trip.price,
				shortfall: trip.price - walletBalance,
			});
		}
		await prisma.$transaction([
			prisma.user.update({ where: { id: trip.clientId }, data: { wallet: { decrement: trip.price } } }),
			prisma.user.update({ where: { id: trip.driverId }, data: { wallet: { increment: trip.price } } }),
			prisma.trip.update({ where: { id: tripId }, data: { status: 'COMPLETED', completedAt } }),
		]);
	} else {
		await prisma.trip.update({ where: { id: tripId }, data: { status: 'COMPLETED', completedAt } });
	}

	await recalculateUserReputation(trip.clientId, completedAt);
	await recalculateUserReputation(trip.driverId, completedAt);

	await sendNotification({ userId: trip.clientId, title: 'انتهت الرحلة', body: 'أنهى السائق الرحلة.', type: 'TRIP_STATUS', data: { tripId, status: 'COMPLETED' } });

	const completedTrips = await prisma.trip.count({ where: { clientId: trip.clientId, status: 'COMPLETED' } });
	const client = await prisma.user.findUnique({ where: { id: trip.clientId } });
	if (completedTrips === 1 && client?.referredById) {
		await issueCoupon({ userId: client.referredById, type: 'REFERRAL', value: 10, validDays: 7 });
	}

	res.status(200).json({ success: true, message: 'تم إنهاء الرحلة بنجاح' });
});

export const getActiveTrip = catchAsync(async (req, res) => {
	const trip = await prisma.trip.findFirst({
		where: { driverId: driverId(req), status: { in: ['BOOKED', 'STARTED'] } },
		orderBy: { createdAt: 'desc' },
		include: { client: { select: { id: true, name: true, phone: true, avatar: true, avgRating: true } } },
	});
	res.status(200).json({ success: true, data: trip });
});

export const getDriverHistory = catchAsync(async (req, res) => {
	const trips = await prisma.trip.findMany({
		where: { driverId: driverId(req), status: 'COMPLETED' },
		orderBy: { completedAt: 'desc' },
		include: { client: { select: { id: true, name: true, avatar: true, avgRating: true } } },
	});
	res.status(200).json({ success: true, data: trips });
});

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = date => {
	const result = startOfDay(date);
	result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
	return result;
};

export const getDriverEarnings = catchAsync(async (req, res) => {
	const now = new Date();
	const [driver, dailyTrips, weeklyTrips] = await Promise.all([
		prisma.user.findUnique({ where: { id: driverId(req) }, select: { wallet: true } }),
		prisma.trip.findMany({ where: { driverId: driverId(req), status: 'COMPLETED', completedAt: { gte: startOfDay(now) } }, select: { price: true, paymentMethod: true } }),
		prisma.trip.findMany({ where: { driverId: driverId(req), status: 'COMPLETED', completedAt: { gte: startOfWeek(now) } }, select: { price: true, paymentMethod: true } }),
	]);
	const summarize = trips => trips.reduce((total, trip) => ({
		cash: total.cash + (trip.paymentMethod === 'CASH' ? trip.price : 0),
		digital: total.digital + (trip.paymentMethod !== 'CASH' ? trip.price : 0),
	}), { cash: 0, digital: 0 });
	res.status(200).json({ success: true, data: { daily: summarize(dailyTrips), weekly: summarize(weeklyTrips), digitalWalletBalance: driver?.wallet || 0 } });
});
