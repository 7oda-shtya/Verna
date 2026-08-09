import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';

export const makeReport = catchAsync(async (req, res) => {
	const { reportedId, reason } = req.body;
	const attachment = req.file?.path || null;
	const { tripId } = req.params;
	const reporterId = req.user.id;

	if (!reportedId || !reason) {
		throw new ApiError(400, 'البيانات المطلوبة ناقصة');
	}

	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة مش موجودة');

	const isPartOfTrip = [trip.clientId, trip.driverId].includes(reporterId) && [trip.clientId, trip.driverId].includes(reportedId);
	if (!isPartOfTrip || reporterId === reportedId) {
		throw new ApiError(403, 'مينفعش تبلغ عن حد مش طرف في الرحلة دي');
	}

	const report = await prisma.report.create({
		data: { reporterId, reportedId, tripId, reason, attachment },
	});

	res.status(201).json({ success: true, data: report });
});



export const getSentReports = catchAsync(async (req, res) => {
	const userId = req.user.id;

	const reports = await prisma.report.findMany({
		where: { reporterId: userId },
		orderBy: { createdAt: 'desc' },
	});

	res.status(200).json({ success: true, data: reports });
});



export const getReceivedReports = catchAsync(async (req, res) => {
	const userId = req.user.id;

	const reports = await prisma.report.findMany({
		where: { reportedId: userId },
		orderBy: { createdAt: 'desc' },
	});

	res.status(200).json({ success: true, data: reports });
});



export const makeRate = catchAsync(async (req, res) => {
	const { rateStars, comment, ratedId } = req.body;
	const { tripId } = req.params;
	const userId = req.user.id;

	if (!rateStars || rateStars < 1 || rateStars > 5) {
		throw new ApiError(400, 'التقييم لازم يكون من 1 لـ 5');
	}

	const trip = await prisma.trip.findUnique({ where: { id: tripId } });
	if (!trip) throw new ApiError(404, 'الرحلة مش موجودة');

	const isPartOfTrip = [trip.clientId, trip.driverId].includes(userId) && [trip.clientId, trip.driverId].includes(ratedId);
	if (!isPartOfTrip || userId === ratedId) {
		throw new ApiError(403, 'مينفعش تقيّم حد مش طرف في الرحلة دي');
	}

	const rate = await prisma.$transaction(async tx => {
		const createdRate = await tx.rate.create({
			data: { raterId: userId, ratedId, tripId, rateStars, comment },
		});
		const rating = await tx.rate.aggregate({
			where: { ratedId },
			_avg: { rateStars: true },
		});
		await tx.user.update({
			where: { id: ratedId },
			data: { avgRating: rating._avg.rateStars },
		});
		return createdRate;
	});

	res.status(201).json({ success: true, data: rate });
});



export const getSentRates = catchAsync(async (req, res) => {
	const userId = req.user.id;

	const rates = await prisma.rate.findMany({
		where: { raterId: userId },
		orderBy: { createdAt: 'desc' },
	});
	res.status(200).json({ success: true, data: rates });
});



export const getReceivedRates = catchAsync(async (req, res) => {
	const userId = req.user.id;

	const rates = await prisma.rate.findMany({
		where: { ratedId: userId },
		orderBy: { createdAt: 'desc' },
	});
	res.status(200).json({ success: true, data: rates });
});

export const support = catchAsync(async (req, res) => {
	const { message } = req.body;
	const attachment = req.file?.path || null;
	const userId = req.user.id;
	if (!message) {
		throw new ApiError(400, 'البيانات المطلوبة ناقصة');
	}
	const supportRequest = await prisma.supportMessage.create({
		data: { userId, attachment, message },
	});
	res.status(200).json({ success: true, data: 'تم إرسال الرسالة بنجاح وهيتم حل المشكلة في أسرع وقت' });
});
