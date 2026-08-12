import bcrypt from 'bcryptjs';
import ApiError from '../../utils/ApiError.js';
import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { generateToken } from '../../utils/auth.helpers.js';
import { recalculateUserReputation } from '../../services/reputation.service.js';
import { generateReferralCode } from '../../utils/referral.js';

const publicUserFields = {
	id: true,
	name: true,
	phone: true,
	email: true,
	role: true,
	avatar: true,
	homeAddress: true,
	officeAddress: true,
	old: true,
	wallet: true,
	username: true,
	avgRating: true,
	referralCode: true,
	accountStatus: true,
	isPhoneVerified: true,
	reputationScore: true,
	reputationLabel: true,
	reputationUpdatedAt: true,
	reputationCompletedTrips: true,
	reputationCancelledTrips: true,
	reputationAcceptedReports: true,
	isBanned: true,
	banReason: true,
	banStartAt: true,
	banEndAt: true,
	reputationBanEndAt: true,
	rapidCancelBanEndAt: true,
	createdAt: true,
};

function toPublicUser(user) {
	return Object.keys(publicUserFields).reduce((acc, key) => {
		acc[key] = user[key];
		return acc;
	}, {});
}

function formatDate(date) {
	if (!date) return null;
	const d = new Date(date);
	const pad = n => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyActivity = {
	coupons: [],
	rates: { sent: [], received: [] },
	reports: { sent: [], received: [] },
	referrals: [],
};

async function getFullProfileById(userId) {
	await recalculateUserReputation(userId);
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			...publicUserFields,
			coupon: {
				select: { id: true, code: true, value: true, validUntil: true }
			},
			ratesGiven: {
				select: { id: true, rateStars: true, comment: true, tripId: true, rated: { select: { id: true, name: true } } }
			},
			ratesReceived: {
				select: { id: true, rateStars: true, comment: true, tripId: true, rater: { select: { id: true, name: true } } }
			},
			reportsSent: {
				select: { id: true, reason: true, status: true, tripId: true, attachment: true, createdAt: true, reported: { select: { id: true, name: true } } }
			},
			reportsReceived: {
				select: { id: true, reason: true, status: true, tripId: true, attachment: true, createdAt: true, reporter: { select: { id: true, name: true } } }
			},
			referrals: {
				select: { id: true, name: true }
			},
		}
	});

	if (!user) return null;

	const { coupon, ratesGiven, ratesReceived, reportsSent, reportsReceived, referrals, ...profile } = user;

	return {
		...profile,
		coupons: coupon.map(c => ({ id: c.id, code: c.code, discount: `خصم ${c.value}%`, validUntil: c.validUntil })),
		rates: {
			sent: ratesGiven.map(r => ({ id: r.id, value: r.rateStars, comment: r.comment, tripId: r.tripId, driverId: r.rated?.id, driverName: r.rated?.name })),
			received: ratesReceived.map(r => ({ id: r.id, value: r.rateStars, comment: r.comment, tripId: r.tripId, driverId: r.rater?.id, driverName: r.rater?.name })),
		},
		reports: {
			sent: reportsSent.map(r => ({ id: r.id, reason: r.reason, status: r.status.toLowerCase(), tripId: r.tripId, attachment: r.attachment, time: formatDate(r.createdAt), driverId: r.reported?.id, driverName: r.reported?.name })),
			received: reportsReceived.map(r => ({ id: r.id, reason: r.reason, status: r.status.toLowerCase(), tripId: r.tripId, attachment: r.attachment, time: formatDate(r.createdAt), sender: r.reporter?.id, senderName: r.reporter?.name })),
		},
		referrals,
	};
}

export const register = catchAsync(async (req, res) => {
	const { name, phone, email, password, username, referralCode } = req.body;

	if (!name || !phone || !password || !username) {
		throw new ApiError(400, 'كل الحقول المطلوبة لازم تتملى');
	}

	const existingPhone = await prisma.user.findUnique({ where: { phone_role: { phone, role: 'CLIENT' } } });
	if (existingPhone) {
		throw new ApiError(400, 'رقم الهاتف ده مسجل بالفعل', 'phone');
	}

	const existingUsername = await prisma.user.findFirst({ where: { username } });
	if (existingUsername) {
		throw new ApiError(400, 'اسم المستخدم ده مستخدم بالفعل', 'username');
	}

	if (email) {
		const existingEmail = await prisma.user.findFirst({ where: { email } });
		if (existingEmail) {
			throw new ApiError(400, 'البريد الإلكتروني ده مستخدم بالفعل', 'email');
		}
	}

	let referredById = null;
	if (referralCode) {
		const referrer = await prisma.user.findFirst({
			where: { referralCode }
		})
		if (referrer) {
			referredById = referrer.id;
		}
	}
	const hashedPassword = await bcrypt.hash(password, 10);

	const newUser = await prisma.user.create({
		data: {
			name,
			phone,
			email,
			password: hashedPassword,
			username,
			role: 'CLIENT',
			referralCode: generateReferralCode(name),
			referredById,
			accountStatus: 'ACTIVE'
		}
	});
	const token = generateToken(newUser);

	res.status(201).json({
		success: true,
		data: {
			token,
			user: { ...toPublicUser(newUser), ...emptyActivity }
		}
	});
});

export const login = catchAsync(async (req, res) => {
	const { identifier: requestedIdentifier, phone, password } = req.body;
	// Keep accepting `phone` temporarily so already-installed app versions can still log in.
	const identifier = requestedIdentifier || phone;

	if (!identifier || !password) {
		throw new ApiError(400, 'رقم الهاتف أو اسم المستخدم وكلمة السر مطلوبين');
	}
	const user = await prisma.user.findFirst({
		where: { OR: [{ phone: identifier, role: 'CLIENT' }, { username: identifier }] },
		select: { id: true, role: true, password: true },
	});
	if (!user) {
		throw new ApiError(401, 'رقم الهاتف أو اسم المستخدم أو كلمة السر غلط');
	}
	if (user.role !== 'CLIENT') {
		throw new ApiError(403, 'الحساب ده مش حساب عميل، استخدم تطبيق السواق');
	}
	const isMatched = await bcrypt.compare(password, user.password);
	if (!isMatched) {
		throw new ApiError(401, 'رقم الهاتف أو اسم المستخدم أو كلمة السر غلط');
	}

	const token = generateToken(user);
	const profile = await getFullProfileById(user.id);
	res.status(200).json({
		success: true,
		data: {
			token,
			user: profile
		}
	})
})

export const me = catchAsync(async (req, res) => {
	const profile = await getFullProfileById(req.user.id);
	if (!profile) throw new ApiError(401, 'اليوزر مش موجود');

	res.status(200).json({
		success: true,
		data: { user: profile }
	});
});

export const updateProfile = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const { name, username, phone, email, homeAddress, officeAddress, old } = req.body;

	if (username !== undefined) {
		const normalizedUsername = username.trim();
		if (!normalizedUsername) {
			throw new ApiError(400, 'اسم المستخدم مطلوب', 'username');
		}
		const existingUsername = await prisma.user.findFirst({
			where: { username: normalizedUsername, NOT: { id: userId } },
		});
		if (existingUsername) {
			throw new ApiError(400, 'اسم المستخدم ده مستخدم بالفعل', 'username');
		}
	}

	if (email) {
		const existingEmail = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
		if (existingEmail) {
			throw new ApiError(400, 'البريد الإلكتروني ده مستخدم بالفعل', 'email');
		}
	}

	if (phone !== undefined) {
		const existingPhone = await prisma.user.findFirst({ where: { phone, role: 'CLIENT', NOT: { id: userId } } });
		if (existingPhone) {
			throw new ApiError(400, 'رقم الهاتف ده مسجل بالفعل', 'phone');
		}
	}

	if (old !== undefined && old !== '') {
		const age = Number(old);
		if (!Number.isInteger(age) || age < 12 || age > 100) {
			throw new ApiError(400, 'العمر لازم يكون رقم صحيح بين 12 و 100', 'old');
		}
	}

	const data = {};
	if (name !== undefined && name.trim()) data.name = name.trim();
	if (username !== undefined) data.username = username.trim();
	if (phone !== undefined) data.phone = phone;
	if (email !== undefined) data.email = email || null;
	if (homeAddress !== undefined) data.homeAddress = homeAddress || null;
	if (officeAddress !== undefined) data.officeAddress = officeAddress || null;
	if (old !== undefined) data.old = old === '' ? null : Number(old);
	if (req.file) data.avatar = req.file.path;

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data,
	});

	res.status(200).json({
		success: true,
		data: { user: toPublicUser(updatedUser) }
	});
});

export const changePassword = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const { currentPassword, newPassword } = req.body;
	if (!currentPassword || !newPassword) {
		throw new ApiError(400, 'كلمة السر الحالية والجديدة مطلوبتان');
	}
	if (newPassword.length < 8) {
		throw new ApiError(400, 'كلمة السر الجديدة لازم تكون 8 أحرف على الأقل');
	}
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
	const matches = user && await bcrypt.compare(currentPassword, user.password);
	if (!matches) throw new ApiError(401, 'كلمة السر الحالية غير صحيحة');
	if (await bcrypt.compare(newPassword, user.password)) {
		throw new ApiError(400, 'كلمة السر الجديدة لازم تكون مختلفة عن الحالية');
	}
	const password = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({ where: { id: userId }, data: { password } });
	res.status(200).json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
});

export const deleteAccount = catchAsync(async (req, res) => {
	const userId = req.user.id;
	const { password } = req.body;
	if (!password) throw new ApiError(400, 'كلمة السر مطلوبة لتأكيد حذف الحساب');
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
	const matches = user && await bcrypt.compare(password, user.password);
	if (!matches) throw new ApiError(401, 'كلمة السر غير صحيحة');

	const suffix = `${Date.now()}-${userId}`;
	const disabledPassword = await bcrypt.hash(`${suffix}-${Math.random()}`, 10);
	await prisma.$transaction([
		prisma.deviceToken.deleteMany({ where: { userId } }),
		prisma.user.update({
			where: { id: userId },
			data: {
				name: 'حساب محذوف',
				phone: `deleted-${suffix}`,
				email: null,
				username: `deleted-${suffix}`,
				referralCode: `DELETED-${suffix}`,
				password: disabledPassword,
				avatar: null,
				homeAddress: null,
				officeAddress: null,
				token: null,
				accountStatus: 'BANNED',
				isPhoneVerified: false,
			},
		}),
	]);
	res.status(200).json({ success: true, message: 'تم حذف الحساب بنجاح' });
});
