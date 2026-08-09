import { prisma } from '../db.js';
import { sendNotification } from './notification.service.js';

export async function applyReportPenalty(report, acceptedReportsCount) {
	if (acceptedReportsCount === 1) {
		await prisma.warning.create({
			data: {
				userId: report.reportedId,
				reason: 'تم قبول التبليغ ضدك',
				reportId: report.id,
			},
		});
		await sendNotification({ userId: report.reportedId, title: 'تحذير جديد', body: 'تم قبول بلاغ ضد حسابك', type: 'WARNING' });
	} else if (acceptedReportsCount === 6) {
		await prisma.user.update({
			where: { id: report.reportedId },
			data: { accountStatus: 'BANNED' },
		});
	} else if (acceptedReportsCount > 3) {
		await prisma.penalty.create({
			data: {
				userId: report.reportedId,
				reportId: report.id,
				amount: 20,
			},
		});
		await sendNotification({ userId: report.reportedId, title: 'غرامة جديدة', body: 'تم إصدار غرامة بقيمة 20', type: 'PENALTY' });
	} else if (acceptedReportsCount > 1) {
		await prisma.penalty.create({
			data: {
				userId: report.reportedId,
				reportId: report.id,
				amount: 10,
			},
		});
		await sendNotification({ userId: report.reportedId, title: 'غرامة جديدة', body: 'تم إصدار غرامة بقيمة 10', type: 'PENALTY' });
	}
}
