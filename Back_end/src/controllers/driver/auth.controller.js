import bcrypt from 'bcryptjs';
import ApiError from '../../utils/ApiError.js';
import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { generateToken } from '../../utils/auth.helpers.js';
import { generateReferralCode } from '../../utils/referral.js';


export const register = catchAsync(async (req, res) => {
	const { name, phone, email, password, username, referralCode } = req.body;

	if (!name || !phone || !password || !username) {
		throw new ApiError(400, 'كل الحقول المطلوبة لازم تتملى');
	}

	const existingUser = await prisma.user.findFirst({
		where: { OR: [{ phone, role: 'DRIVER' }, ...(email ? [{ email }] : []), { username }] }
	});
	if (existingUser) {
		throw new ApiError(400, 'الرقم أو الإيميل أو اسم المستخدم ده مستخدم قبل كده');
	}

	// Not restricted by role — whoever gave the driver their code (client or driver) gets credit.
	let referredById = null;
	if (referralCode) {
		const referrer = await prisma.user.findFirst({ where: { referralCode } });
		if (referrer) referredById = referrer.id;
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const newUser = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				name,
				phone,
				email,
				password: hashedPassword,
				username,
				role: 'DRIVER',
				accountStatus: 'PENDING',
				referralCode: generateReferralCode(name),
				referredById
				,driverLicense: req.files?.license?.[0]?.path || null
			}
		});
		await tx.car.create({
			data: {
				plateNumber: '',
				model: '',
				driverId: user.id,
				picture: req.files?.carPicture?.[0]?.path || null,
			},
		});
		return await tx.user.findUnique({
			where: { id: user.id },
			include: {
				car: true
			}
		});;
	});
	const token = generateToken(newUser);

	res.status(201).json({
		success: true,
		data: {
			token,
			user: {
				id: newUser.id,
				name: newUser.name,
				role: newUser.role,
				accountStatus: newUser.accountStatus,
				isOnline: newUser.isOnline,
				// Fixed: this response never included isPhoneVerified, so after every
				// register/login the app's Redux state fell back to its initial `false`
				// value (since the field was simply absent from the payload) and gated the
				// driver into the OTP screen again even though the DB already had
				// isPhoneVerified: true from a previous verification. /auth/me was fine
				// (it selects the full profile), which is why a silent session restore
				// worked but an explicit register/login kept re-asking for the code.
				isPhoneVerified: newUser.isPhoneVerified,
				included: {
					car: {
						plateNumber: newUser.car.plateNumber,
						model: newUser.car.model
					}
				}
			}

		}
	});
});


export const login = catchAsync(async (req, res) => {
	const { phone, password } = req.body;

	if (!phone || !password) {
		throw new ApiError(400, 'الرقم وكلمة السر مطلوبين');
	}
	const user = await prisma.user.findUnique({ where: { phone_role: { phone, role: 'DRIVER' } }, include: { car: true } });
	if (!user) {
		throw new ApiError(401, 'الرقم أو كلمة السر غلط');
	}
	if (user.role !== 'DRIVER') {
		throw new ApiError(403, 'الحساب ده مش مسجل كسواق');
	}
	const isMatched = await bcrypt.compare(password, user.password);
	if (!isMatched) {
		throw new ApiError(401, 'الرقم أو كلمة السر غلط');
	}

	if (!user.car) {
		throw new ApiError(409, 'بيانات العربية مش مكتملة، تواصل مع الدعم');
	}

	const token = generateToken(user);
	res.status(200).json({
		success: true,
		data: {
			token,
			user: {
				id: user.id,
				name: user.name,
				role: user.role,
				accountStatus: user.accountStatus,
				isOnline: user.isOnline,
				// Same fix as register(): include the real persisted value instead of
				// letting the app default it to false on every login.
				isPhoneVerified: user.isPhoneVerified,
				included: {
					car: {
						plateNumber: user.car.plateNumber,
						model: user.car.model
					}
				}
			}
		}
	})
})

export const me = catchAsync(async (req, res) => {
	// req.user (from the shared authenticate middleware) doesn't select car/driverLicense/KYC
	// fields, so the KYC/onboarding screens need their own query to see what's already uploaded.
	const user = await prisma.user.findUnique({
		where: { id: req.user.id },
		select: {
			id: true, name: true, phone: true, email: true, role: true, avatar: true,
			homeAddress: true, officeAddress: true, wallet: true, username: true, avgRating: true,
			referralCode: true, accountStatus: true, createdAt: true, isPhoneVerified: true, isOnline: true,
			driverLicense: true, nationalIdFront: true, nationalIdBack: true,
			reputationScore: true, reputationLabel: true, reputationUpdatedAt: true,
			reputationCompletedTrips: true, reputationCancelledTrips: true, reputationAcceptedReports: true,
			isBanned: true, banReason: true, banStartAt: true, banEndAt: true,
			car: { select: { model: true, plateNumber: true, picture: true, licenseDocument: true, seats: true } },
		},
	});
	res.status(200).json({
		success: true,
		data: { user }
	});
});

export const toggleDriverStatus = catchAsync(async (req, res) => {
	const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, role: true, isOnline: true } });
	if (!current || current.role !== 'DRIVER') throw new ApiError(403, 'هذا الإجراء متاح للسائقين فقط');
	const isOnline = typeof req.body.isOnline === 'boolean' ? req.body.isOnline : !current.isOnline;
	const user = await prisma.user.update({ where: { id: current.id }, data: { isOnline }, select: { id: true, isOnline: true } });
	res.status(200).json({ success: true, data: user });
});

export const updateKyc = catchAsync(async (req, res) => {
	const driverId = req.user.id;
	const data = {};
	if (req.files?.license?.[0]) data.driverLicense = req.files.license[0].path;
	if (req.files?.nationalIdFront?.[0]) data.nationalIdFront = req.files.nationalIdFront[0].path;
	if (req.files?.nationalIdBack?.[0]) data.nationalIdBack = req.files.nationalIdBack[0].path;
	const carData = {};
	if (req.files?.carPicture?.[0]) carData.picture = req.files.carPicture[0].path;
	if (req.files?.carLicense?.[0]) carData.licenseDocument = req.files.carLicense[0].path;
	if (req.body.model) carData.model = req.body.model.trim();
	if (req.body.plateNumber) carData.plateNumber = req.body.plateNumber.trim();

	const [user, car] = await prisma.$transaction([
		prisma.user.update({
			where: { id: driverId },
			data,
			select: {
				id: true, name: true, phone: true, email: true, role: true, avatar: true, accountStatus: true,
				isOnline: true, driverLicense: true, nationalIdFront: true, nationalIdBack: true,
			},
		}),
		prisma.car.update({ where: { driverId }, data: carData, select: { model: true, plateNumber: true, picture: true, licenseDocument: true, seats: true } }),
	]);
	res.status(200).json({ success: true, data: { user, car } });
});