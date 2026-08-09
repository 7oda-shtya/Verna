import { prisma } from '../../db.js';
import { catchAsync } from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';

export const getTripMessages = catchAsync(async (req, res) => {
  const { tripId } = req.params;
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ clientId: req.user.id }, { driverId: req.user.id }],
    },
    select: { id: true },
  });
  if (!trip) throw new ApiError(403, 'مش مسموحلك تشوف رسائل الرحلة دي');

  const messages = await prisma.message.findMany({
    where: { tripId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
  });
  res.status(200).json({ success: true, data: messages });
});
