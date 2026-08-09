import { prisma } from '../db.js';
import { sendNotification } from './notification.service.js';

export function generateCouponCode() {
  return 'VERNA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function issueCoupon({ userId, type, value, validDays }) {
  const coupon = await prisma.coupon.create({
    data: {
      code: generateCouponCode(),
      userId,
      type,
      value,
      validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
    },
  });
  await sendNotification({
    userId,
    title: 'كوبون جديد',
    body: `تم إضافة كوبون خصم ${value}% لحسابك`,
    type: 'COUPON',
    data: { couponId: coupon.id },
  });
  return coupon;
}
