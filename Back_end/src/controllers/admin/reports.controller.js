import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { applyReportPenalty } from '../../services/penalty.service.js';

export const getPendingReports = catchAsync(async (req, res) => {
	const reports = await prisma.report.findMany({
		where: { status: 'PENDING' },
		orderBy: { createdAt: 'desc' },
	});
	res.status(200).json({ success: true, data: reports });
});


export const getRejectedReports = catchAsync(async (req, res) => {
	const reports = await prisma.report.findMany({
		where: { status: 'REJECTED' },
		orderBy: { createdAt: 'desc' },
	});
	res.status(200).json({ success: true, data: reports });
});


export const getAcceptedReports = catchAsync(async (req, res) => {
	const reports = await prisma.report.findMany({
		where: { status: 'ACCEPTED' },
		orderBy: { createdAt: 'desc' },
	});
	res.status(200).json({ success: true, data: reports });
});


export const getReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const report = await prisma.report.findUnique({ where: { id } });
	if (!report) throw new ApiError(404, 'التبليغ مش موجود');
	res.status(200).json({ success: true, data: report });
});

export const checkReport = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;

	const report = await prisma.report.findUnique({ where: { id } });
	if (!report) throw new ApiError(404, 'التبليغ مش موجود');
	const updatedReport = await prisma.report.update({ where: { id }, data: { status, reviewedAt: new Date() } });
	const AcceptedReportsCount = await prisma.report.count({ where: { reportedId: report.reportedId, status: 'ACCEPTED' }, });

	await applyReportPenalty(report, AcceptedReportsCount);

	res.status(200).json({ success: true, data: updatedReport });
});
