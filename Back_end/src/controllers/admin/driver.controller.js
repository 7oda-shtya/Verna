import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';

const completeKycWhere = {
	driverLicense: { not: null },
	nationalIdFront: { not: null },
	nationalIdBack: { not: null },
	car: {
		is: {
			picture: { not: null },
			licenseDocument: { not: null },
			model: { not: '' },
			plateNumber: { not: '' },
		},
	},
};

export function isDriverKycComplete(user) {
	if (!user) return false;
	const car = user.car;
	return Boolean(
		user.driverLicense &&
		user.nationalIdFront &&
		user.nationalIdBack &&
		car?.picture &&
		car?.licenseDocument &&
		String(car.model || '').trim() &&
		String(car.plateNumber || '').trim(),
	);
}

export const getPendingDrivers = catchAsync(async (req, res) => {
	const drivers = await prisma.user.findMany({
		where: { role: 'DRIVER', accountStatus: 'PENDING', ...completeKycWhere },
		include: { car: true },
		orderBy: { createdAt: 'asc' },
	});
	res.status(200).json({ success: true, data: drivers });
});

export const reviewDriver = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { decision } = req.body;

	const driver = await prisma.user.findUnique({ where: { id }, include: { car: true } });
	if (!driver || driver.role !== 'DRIVER') {
		throw new ApiError(404, 'السواق مش موجود');
	}
	if (driver.accountStatus !== 'PENDING') {
		throw new ApiError(400, 'الحساب ده اتراجع قبل كده');
	}
	if (!isDriverKycComplete(driver)) {
		throw new ApiError(400, 'ملف السائق غير مكتمل ولا يمكن مراجعته بعد');
	}

	const updated = await prisma.user.update({
		where: { id },
		data: { accountStatus: decision },
	});

	res.status(200).json({ success: true, data: updated });
});
