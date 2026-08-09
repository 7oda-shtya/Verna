import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { sendNotification } from '../../services/notification.service.js';
import { applyClientCancellationConsequences, assertUserCanRequestTrip } from '../../services/reputation.service.js';
import { emitToOnlineDrivers } from '../../socket/index.js';

const rideFeedPayload = trip => ({
	id: trip.id,
	startName: trip.startName,
	endName: trip.endName,
	ridersCount: trip.ridersCount,
	customerNote: trip.customerNote,
	price: trip.price,
	scheduledTime: trip.scheduledTime,
});

export const RequestTrip = catchAsync(async (req, res) => {
	const clientId = req.user.id;
	await assertUserCanRequestTrip(clientId);
	const { startLocation, endLocation, ridersCount, customerNote, scheduledTime, pickupDistanceM, farFromPickupNote, waypoints, route } = req.body;
	const paymentMethod = String(req.body.paymentMethod || 'CASH').toUpperCase();
	const latestTrip = await prisma.trip.findFirst({
		where: { clientId },
		orderBy: { createdAt: 'desc' },
	});
	if (latestTrip && ['PENDING', 'BOOKED', 'STARTED'].includes(latestTrip.status)) {
		throw new ApiError(409, 'لديك رحلة نشطة بالفعل. يمكنك تعديلها أو إلغاؤها من الصفحة الرئيسية');
	}

	// تنظيف أي طلبات معلقة قديمة ناتجة عن إعادة إرسال الطلب قبل إضافة قفل الإرسال.
	await prisma.$transaction([
		prisma.offer.updateMany({
			where: { trip: { is: { clientId, status: 'PENDING' } }, status: { in: ['PENDING', 'ACCEPTED'] } },
			data: { status: 'CANCELLED' },
		}),
		prisma.trip.updateMany({
			where: { clientId, status: 'PENDING' },
			data: { status: 'CANCELLED' },
		}),
	]);

	const trip = await prisma.trip.create({
		data: {
			clientId,
			startLat: startLocation.lat,
			startLng: startLocation.lng,
			startName: startLocation.name,
			endLat: endLocation.lat,
			endLng: endLocation.lng,
			endName: endLocation.name,
			ridersCount,
			customerNote,
			scheduledTime,
			pickupDistanceM,
			farFromPickupNote,
			waypoints,
			route,
			paymentMethod,
		},
	});

	const onlineDrivers = await prisma.user.findMany({
		where: { role: 'DRIVER', isOnline: true, accountStatus: 'ACTIVE', isBanned: false },
		select: { id: true },
	});
	await Promise.allSettled(onlineDrivers.map(driver => sendNotification({
		userId: driver.id,
		title: 'طلب رحلة جديد',
		body: `${trip.startName || 'نقطة البداية'} إلى ${trip.endName || 'الوجهة'}`,
		type: 'NEW_RIDE_REQUEST',
		data: { tripId: trip.id },
		channelId: 'ride-requests',
	})));
	emitToOnlineDrivers('ride:new', rideFeedPayload(trip));

	res.status(200).json({ success: true, data: trip });
})

export const updateTrip = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const clientId = req.user.id;
	const { startLocation, endLocation, ridersCount, customerNote, scheduledTime, pickupDistanceM, farFromPickupNote, waypoints, route } = req.body;

	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة مش موجودة');
	if (trip.clientId !== clientId) throw new ApiError(403, 'مش مسموحلك تعدّل الرحلة دي');
	if (trip.status !== 'PENDING') throw new ApiError(400, 'لا يمكن تعديل الرحلة بعد قبول سائق');
	if (!startLocation || !endLocation) throw new ApiError(400, 'نقطة البداية والوجهة مطلوبين');

	const updatedTrip = await prisma.$transaction(async tx => {
		await tx.offer.updateMany({
			where: { tripId, status: { in: ['PENDING', 'ACCEPTED'] } },
			data: { status: 'CANCELLED' },
		});

		return tx.trip.update({
			where: { id: tripId },
			data: {
				startLat: startLocation.lat,
				startLng: startLocation.lng,
				startName: startLocation.name,
				endLat: endLocation.lat,
				endLng: endLocation.lng,
				endName: endLocation.name,
				ridersCount,
				customerNote,
				scheduledTime,
				pickupDistanceM,
				farFromPickupNote,
				waypoints,
				route,
				price: 0,
				driverId: null,
				status: 'PENDING',
			},
		});
	});

	res.status(200).json({ success: true, data: updatedTrip, message: 'تم تعديل الرحلة وإلغاء العروض القديمة' });
})

export const cancelTrip = catchAsync(async (req, res) => {
	const { tripId } = req.params;
	const clientId = req.user.id;

	const trip = await prisma.trip.findUnique({
		where: { id: tripId },
	});
	if (!trip) throw new ApiError(404, 'الرحلة مش موجودة');
	if (trip.clientId !== clientId) {
		throw new ApiError(403, 'مش مسموحلك تلغي الرحلة ده');
	}
	if (trip.status === 'PENDING') {
		const cancelledAt = new Date();
		await prisma.$transaction([
			prisma.offer.updateMany({
				where: { trip: { is: { clientId, status: 'PENDING' } }, status: { in: ['PENDING', 'ACCEPTED'] } },
				data: { status: 'CANCELLED' },
			}),
			prisma.trip.updateMany({
				where: { clientId, status: 'PENDING' },
				data: { status: 'CANCELLED', cancelledAt },
			}),
		]);
		const user = await applyClientCancellationConsequences(clientId, cancelledAt);
		emitToOnlineDrivers('ride:cancelled', { tripId });
		res.status(200).json({
			success: true,
			message: 'Trip canceled successfully',
			data: {
				ban: {
					isBanned: user.isBanned,
					banReason: user.banReason,
					banStartAt: user.banStartAt,
					banEndAt: user.banEndAt,
					reputationBanEndAt: user.reputationBanEndAt,
					rapidCancelBanEndAt: user.rapidCancelBanEndAt,
					reputationScore: user.reputationScore,
					reputationLabel: user.reputationLabel,
					reputationUpdatedAt: user.reputationUpdatedAt,
					reputationCompletedTrips: user.reputationCompletedTrips,
					reputationCancelledTrips: user.reputationCancelledTrips,
					reputationAcceptedReports: user.reputationAcceptedReports,
				},
			},
		});
	} else if (trip.status === 'BOOKED') {
		const cancelledAt = new Date();
		await prisma.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED', cancelledAt } });
		const user = await applyClientCancellationConsequences(clientId, cancelledAt);
		if (trip.driverId) {
			await sendNotification({
				userId: trip.driverId,
				title: 'تم إلغاء الرحلة',
				body: 'قام العميل بإلغاء الرحلة المحجوزة.',
				type: 'TRIP_STATUS',
				data: { tripId, status: 'CANCELLED_BY_CLIENT' },
			});
		}
		res.status(200).json({ success: true, message: 'Trip canceled successfully', data: { ban: user } });
	} else {
		res.status(400).json({ success: false, message: 'Trip cannot be canceled' });
	}
})

export const getMyTrips = catchAsync(async (req, res) => {
	const clientId = req.user.id;
	const trips = await prisma.trip.findMany({
		where: { clientId },
		orderBy: { createdAt: 'desc' },
		include: {
			driver: {
				select: {
					name: true,
					avatar: true,
					avgRating: true,
					car: { select: { model: true, plateNumber: true, picture: true } },
				},
			},
		},
	});
	res.status(200).json({ success: true, data: trips });
})

export const getPendingTripOffers = catchAsync(async (req, res) => {
	const clientId = req.user.id;
	const { tripId } = req.params;

	const offers = await prisma.offer.findMany({
		where: { tripId, trip: { clientId }, status: 'PENDING' },
		orderBy: { createdAt: 'desc' },
		include: {
			driver: {
				select: { id: true, name: true, avatar: true, avgRating: true, car: { select: { model: true, plateNumber: true, picture: true } } },
			},
		},
	});
	res.status(200).json({ success: true, data: offers });
})

export const acceptOffer = catchAsync(async (req, res) => {
  const clientId = req.user.id;
  const { offerId } = req.params;
  const paymentResolution = req.body?.paymentResolution; // 'CASH' | 'SPLIT', only relevant for WALLET trips

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { trip: true },
  });

  if (!offer) throw new ApiError(404, 'العرض مش موجود');
  if (offer.trip.clientId !== clientId) {
    throw new ApiError(403, 'مش مسموحلك تقبل العرض ده');
  }
  if (offer.trip.status !== 'PENDING') {
    throw new ApiError(400, 'الرحلة دي اتقفلت أو اتقبل فيها عرض قبل كده');
  }

  // Checked here (not just at endTrip) so the client picks a fallback before the trip is even
  // booked, instead of a driver discovering the shortfall only once the ride is already over.
  let finalPaymentMethod = offer.trip.paymentMethod;
  if (offer.trip.paymentMethod === 'WALLET') {
    if (paymentResolution === 'SPLIT') {
      throw new ApiError(400, 'الدفع الجزئي (محفظة + نقدي) غير متاح حاليًا', 'SPLIT_NOT_AVAILABLE');
    }
    if (paymentResolution === 'CASH') {
      finalPaymentMethod = 'CASH';
    } else {
      const client = await prisma.user.findUnique({ where: { id: clientId }, select: { wallet: true } });
      const walletBalance = client?.wallet ?? 0;
      if (walletBalance < offer.price) {
        throw new ApiError(409, 'رصيدك في المحفظة غير كافٍ لتغطية سعر هذا العرض', 'INSUFFICIENT_WALLET_BALANCE', {
          walletBalance,
          price: offer.price,
          shortfall: offer.price - walletBalance,
        });
      }
    }
  }

  const updatedTrip = await prisma.$transaction(async (tx) => {
    await tx.offer.updateMany({
      where: { tripId: offer.tripId, id: { not: offerId } },
      data: { status: 'REJECTED' },
    });
    return tx.trip.update({
      where: { id: offer.tripId },
      data: { driverId: offer.driverId, price: offer.price, status: 'BOOKED', paymentMethod: finalPaymentMethod },
      include: {
        driver: { select: { id: true, name: true, phone: true, avatar: true, avgRating: true, car: { select: { model: true, plateNumber: true, picture: true } } } },
      },
    });
  });
  await sendNotification({
    userId: offer.driverId,
    title: 'تم قبول عرضك',
    body: 'العميل وافق على عرض الرحلة',
    type: 'OFFER_ACCEPTED',
    data: { tripId: updatedTrip.id },
  });
  emitToOnlineDrivers('ride:taken', { tripId: updatedTrip.id });

  res.status(200).json({ success: true, data: updatedTrip });
});

