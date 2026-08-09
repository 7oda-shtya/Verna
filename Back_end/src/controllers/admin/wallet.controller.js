import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { sendNotification } from '../../services/notification.service.js';

const modelFor = type => {
  if (type === 'recharge') return prisma.rechargeRequest;
  if (type === 'withdrawal') return prisma.withdrawalRequest;
  throw new ApiError(400, 'نوع الطلب غير صالح');
};

export const getPendingWalletRequests = catchAsync(async (req, res) => {
  const [recharges, withdrawals] = await Promise.all([
    prisma.rechargeRequest.findMany({ where: { status: 'PENDING' }, include: { user: { select: { id: true, name: true, phone: true, wallet: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.withdrawalRequest.findMany({ where: { status: 'PENDING' }, include: { user: { select: { id: true, name: true, phone: true, wallet: true } } }, orderBy: { createdAt: 'asc' } }),
  ]);
  res.status(200).json({ success: true, data: { recharges, withdrawals } });
});

export const reviewWalletRequest = catchAsync(async (req, res) => {
  const { type, id } = req.params;
  const status = req.body.status?.toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) throw new ApiError(400, 'القرار لازم يكون APPROVED أو REJECTED');
  const model = modelFor(type);

  const updated = await prisma.$transaction(async tx => {
    const txModel = type === 'recharge' ? tx.rechargeRequest : tx.withdrawalRequest;
    const request = await txModel.findUnique({ where: { id } });
    if (!request) throw new ApiError(404, 'الطلب غير موجود');
    if (request.status !== 'PENDING') throw new ApiError(409, 'تمت مراجعة الطلب من قبل');

    if (status === 'APPROVED') {
      if (type === 'recharge') {
        await tx.user.update({ where: { id: request.userId }, data: { wallet: { increment: request.amount } } });
      } else {
        const result = await tx.user.updateMany({
          where: { id: request.userId, wallet: { gte: request.amount } },
          data: { wallet: { decrement: request.amount } },
        });
        if (!result.count) throw new ApiError(400, 'رصيد المستخدم غير كافي');
      }
    }
    return txModel.update({ where: { id }, data: { status, reviewedAt: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await sendNotification({
    userId: updated.userId,
    title: status === 'APPROVED' ? 'تم قبول طلب المحفظة' : 'تم رفض طلب المحفظة',
    body: `${type === 'recharge' ? 'طلب الشحن' : 'طلب السحب'} بقيمة ${updated.amount}`,
    type: 'WALLET_REQUEST',
    data: { requestId: updated.id, requestType: type, status },
  });
  res.status(200).json({ success: true, data: updated });
});
