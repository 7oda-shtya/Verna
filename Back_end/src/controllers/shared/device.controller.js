import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import { Expo } from 'expo-server-sdk';

export const registerDeviceToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  if (!Expo.isExpoPushToken(token)) throw new ApiError(400, 'Expo push token غير صالح');
  const deviceToken = await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: req.user.id },
    create: { token, userId: req.user.id },
  });
  res.status(200).json({ success: true, data: deviceToken });
});
