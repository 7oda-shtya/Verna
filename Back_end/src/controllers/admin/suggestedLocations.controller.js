import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { issueCoupon } from "../../services/coupon.service.js";
import ApiError from '../../utils/ApiError.js';


export const getPendingSuggestedLocations = catchAsync(async (req, res) => {
	const locations = await prisma.areaSuggestion.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
	res.status(200).json({ success: true, data: locations });
});


export const reviewSuggestedLocation = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { decision, importance } = req.body;

	const AreaSuggestion = await prisma.areaSuggestion.findUnique({ where: { id } });
	if (!AreaSuggestion) {
		throw new ApiError(404, 'المكان ده مش موجود');
	}
	if (AreaSuggestion.status !== 'PENDING') {
		throw new ApiError(400, 'المكان ده اتراجع قبل كده');
	}
	await prisma.areaSuggestion.update({
		where: { id },
		data: { status: decision },
	});
	if (decision === 'APPROVED') {
		const approvedCount = await prisma.areaSuggestion.count({
			where: { suggestedById: AreaSuggestion.suggestedById, status: 'APPROVED' },
		});
		await prisma.location.create({
			data: {
				lat: AreaSuggestion.lat,
				lng: AreaSuggestion.lng,
				name: AreaSuggestion.name,
				importance: importance ?? null,
			}
		});
		if (approvedCount > 0 && approvedCount % 7 === 0) {
			await issueCoupon({ userId: AreaSuggestion.suggestedById, type: 'CONTRIBUTOR', value: 25, validDays: 7 });
		}
	}





	res.status(200).json({ success: true, message: `تم ${decision === 'APPROVED' ? 'قبول' : 'رفض'} المكان بنجاح` });
});