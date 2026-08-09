import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';

function requestData(req) {
  const amount = Number(req.body.amount);
  const proof = req.body.proof?.trim();
  if (!Number.isInteger(amount) || amount <= 0) throw new ApiError(400, 'المبلغ لازم يكون رقم صحيح أكبر من صفر');
  if (!proof) throw new ApiError(400, 'مرجع التحويل مطلوب');
  return { amount, proof, userId: req.user.id };
}

export const submitRecharge = catchAsync(async (req, res) => {
  const request = await prisma.rechargeRequest.create({ data: requestData(req) });
  res.status(201).json({ success: true, data: request });
});

export const submitWithdrawal = catchAsync(async (req, res) => {
  const data = requestData(req);
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { wallet: true } });
  if (user.wallet < data.amount) throw new ApiError(400, 'الرصيد غير كافي');
  const request = await prisma.withdrawalRequest.create({ data });
  res.status(201).json({ success: true, data: request });
});

export const getMyWalletRequests = catchAsync(async (req, res) => {
  const [recharges, withdrawals] = await Promise.all([
    prisma.rechargeRequest.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.withdrawalRequest.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
  ]);
  res.status(200).json({ success: true, data: { recharges, withdrawals } });
});
