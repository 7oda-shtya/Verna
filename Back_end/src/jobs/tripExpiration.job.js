import cron from 'node-cron';
import { prisma } from '../db.js';
import { sendNotification } from '../services/notification.service.js';
import { emitToOnlineDrivers } from '../socket/index.js';

const STALE_PENDING_MINUTES = 15;

// No reputation/ban consequence here on purpose — unlike a client-initiated cancel, the client
// did nothing wrong here (no driver ever responded), so this only sets CANCELLED, notifies them,
// and cleans up dangling offers/feed entries. Runs every 5 minutes; cheap no-op when nothing's stale.
cron.schedule('*/5 * * * *', async () => {
  try {
    const staleThreshold = new Date(Date.now() - STALE_PENDING_MINUTES * 60 * 1000);
    const staleTrips = await prisma.trip.findMany({
      where: { status: 'PENDING', createdAt: { lt: staleThreshold } },
      select: { id: true, clientId: true },
    });
    if (!staleTrips.length) return;

    const tripIds = staleTrips.map(trip => trip.id);
    const cancelledAt = new Date();

    await prisma.$transaction([
      prisma.offer.updateMany({
        where: { tripId: { in: tripIds }, status: { in: ['PENDING', 'ACCEPTED'] } },
        data: { status: 'CANCELLED' },
      }),
      prisma.trip.updateMany({
        where: { id: { in: tripIds } },
        data: { status: 'CANCELLED', cancelledAt },
      }),
    ]);

    await Promise.allSettled(staleTrips.map(trip => sendNotification({
      userId: trip.clientId,
      title: 'انتهت صلاحية طلب الرحلة',
      body: 'معدش فيه سائق قبل الطلب خلال 15 دقيقة، فتم إلغاؤه تلقائيًا. جرّب تطلب رحلة تانية.',
      type: 'TRIP_STATUS',
      data: { tripId: trip.id, status: 'CANCELLED' },
    })));

    staleTrips.forEach(trip => emitToOnlineDrivers('ride:cancelled', { tripId: trip.id }));

    console.log(`تم إلغاء ${staleTrips.length} رحلة معلقة تخطت 15 دقيقة بدون سائق.`);
  } catch (error) {
    console.error('تعذر إلغاء الرحلات المعلقة القديمة:', error);
  }
}, { timezone: 'Africa/Cairo' });
