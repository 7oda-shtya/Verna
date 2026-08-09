import bcrypt from 'bcryptjs';
import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { sendWhatsAppMessage } from '../../services/whatsappService.js';

const PURPOSES = ['PHONE_VERIFICATION', 'PASSWORD_RESET'];
const OTP_TTL_MS = 10 * 60 * 1000;

function validatePurpose(purpose) {
  if (!PURPOSES.includes(purpose)) throw new ApiError(400, 'غرض رمز التحقق غير صالح');
}

async function validOtp(phone, code, purpose) {
  return prisma.otpCode.findFirst({
    where: { phone, code, purpose, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
}

export const requestOtp = catchAsync(async (req, res) => {
  const { phone, purpose = 'PHONE_VERIFICATION' } = req.body;
  if (!phone) throw new ApiError(400, 'رقم الهاتف مطلوب');
  validatePurpose(purpose);
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (!user) throw new ApiError(404, 'الحساب غير موجود');

  await prisma.otpCode.updateMany({
    where: { phone, purpose, verifiedAt: null },
    data: { expiresAt: new Date() },
  });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.otpCode.create({
    data: { phone, purpose, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  const delivery = await sendWhatsAppMessage(phone, `كود التأكيد بتاعك هو: ${code}`);
  if (!delivery.success) throw new ApiError(503, 'تعذر إرسال رمز التحقق عبر WhatsApp، حاول مرة أخرى');
  res.status(200).json({ success: true, message: 'تم إرسال رمز التحقق عبر WhatsApp' });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const { phone, code, purpose = 'PHONE_VERIFICATION' } = req.body;
  validatePurpose(purpose);
  const otp = await validOtp(phone, code, purpose);
  if (!otp) throw new ApiError(400, 'رمز التحقق غير صحيح أو منتهي');

  await prisma.$transaction(async tx => {
    await tx.otpCode.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });
    if (purpose === 'PHONE_VERIFICATION') {
      await tx.user.update({ where: { phone }, data: { isPhoneVerified: true } });
    }
  });
  res.status(200).json({ success: true, data: { verified: true, purpose } });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { phone, code, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) throw new ApiError(400, 'كلمة السر لازم تكون 8 أحرف على الأقل');
  // The new client flow verifies the OTP before arriving here, while older
  // clients still submit the valid code directly to the reset endpoint.
  const otp = await prisma.otpCode.findFirst({
    where: { phone, code, purpose: 'PASSWORD_RESET', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new ApiError(400, 'رمز التحقق غير صحيح أو منتهي');
  const password = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { phone }, data: { password } }),
    prisma.otpCode.update({ where: { id: otp.id }, data: { verifiedAt: new Date(), expiresAt: new Date() } }),
  ]);
  res.status(200).json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
});
