import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { sendNotification } from '../services/notification.service.js';

const ACTIVE_TRIP_STATUSES = ['BOOKED', 'STARTED'];
const LOCATION_SHARING_OFFER_STATUSES = ['PENDING', 'ACCEPTED'];
const DRIVERS_ONLINE_ROOM = 'drivers:online';
const DRIVER_OFFLINE_GRACE_MS = 90 * 1000;

let ioInstance = null;

// Tracks each driver's live socket ids (a driver can have more than one connection — e.g. a
// reconnect racing the old socket's disconnect) so we only start the offline grace timer once
// their last socket drops, and cancel it if they reconnect within the window instead of flapping
// isOnline on brief network blips.
const driverSocketsByUserId = new Map(); // userId -> Set<socketId>
const pendingOfflineTimers = new Map(); // userId -> Timeout

function cancelPendingOffline(userId) {
  const timer = pendingOfflineTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    pendingOfflineTimers.delete(userId);
  }
}

// Lets trip controllers push feed updates (ride:new / ride:taken / ride:cancelled) to every
// online driver's socket without importing socket internals — mirrors sendNotification's shape.
export function emitToOnlineDrivers(event, payload) {
  ioInstance?.to(DRIVERS_ONLINE_ROOM).emit(event, payload);
}

// Every authenticated socket auto-joins its own `user:{id}` room on connect (below), so this
// reaches a specific user regardless of which trip room(s) they currently belong to — needed for
// events like a new offer, which happen while the trip is still PENDING (before trip:join applies).
export function emitToUser(userId, event, payload) {
  if (!userId) return;
  ioInstance?.to(`user:${userId}`).emit(event, payload);
}

async function getTripForParticipant(tripId, userId) {
  if (!tripId || typeof tripId !== 'string') return null;
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { status: { in: ACTIVE_TRIP_STATUSES }, OR: [{ clientId: userId }, { driverId: userId }] },
        {
          status: 'PENDING',
          OR: [
            { clientId: userId },
            { offers: { some: { driverId: userId, status: { in: LOCATION_SHARING_OFFER_STATUSES } } } },
          ],
        },
      ],
    },
    select: { id: true, clientId: true, driverId: true, status: true },
  });
}

function socketToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers.authorization;
  return authToken || (header?.startsWith('Bearer ') ? header.slice(7) : null);
}

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(',').map(value => value.trim()) || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socketToken(socket);
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  ioInstance = io;

  io.on('connection', socket => {
    socket.join(`user:${socket.data.userId}`);

    if (socket.data.role === 'DRIVER') {
      const userId = socket.data.userId;
      if (!driverSocketsByUserId.has(userId)) driverSocketsByUserId.set(userId, new Set());
      driverSocketsByUserId.get(userId).add(socket.id);
      // Fresh connect or a reconnect within the grace window — either way, don't flip offline.
      cancelPendingOffline(userId);
    }

    socket.on('disconnect', () => {
      if (socket.data.role !== 'DRIVER') return;
      const userId = socket.data.userId;
      const sockets = driverSocketsByUserId.get(userId);
      sockets?.delete(socket.id);
      if (sockets && sockets.size > 0) return; // still connected via another socket
      driverSocketsByUserId.delete(userId);

      const timer = setTimeout(async () => {
        pendingOfflineTimers.delete(userId);
        try {
          await prisma.user.update({ where: { id: userId }, data: { isOnline: false } });
        } catch (error) {
          console.error('Failed to mark driver offline after disconnect grace period:', error.message);
        }
      }, DRIVER_OFFLINE_GRACE_MS);
      pendingOfflineTimers.set(userId, timer);
    });

    socket.on('drivers:subscribe', (_payload, acknowledge) => {
      if (socket.data.role !== 'DRIVER') {
        acknowledge?.({ success: false, message: 'Only drivers can subscribe to this room' });
        return;
      }
      socket.join(DRIVERS_ONLINE_ROOM);
      acknowledge?.({ success: true });
    });

    socket.on('drivers:unsubscribe', () => {
      socket.leave(DRIVERS_ONLINE_ROOM);
    });

    socket.on('trip:join', async (tripId, acknowledge) => {
      try {
        const trip = await getTripForParticipant(tripId, socket.data.userId);
        if (!trip) throw new Error('Active trip not found or access denied');
        await socket.join(`trip:${trip.id}`);
        acknowledge?.({ success: true });
      } catch (error) {
        acknowledge?.({ success: false, message: error.message });
      }
    });

    socket.on('trip:leave', tripId => {
      if (typeof tripId === 'string') socket.leave(`trip:${tripId}`);
    });

    socket.on('location:update', async (payload, acknowledge) => {
      try {
        const { tripId, lat, lng } = payload || {};
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error('Valid latitude and longitude are required');
        }
        const trip = await getTripForParticipant(tripId, socket.data.userId);
        if (!trip) throw new Error('Active trip not found or access denied');
        const room = `trip:${trip.id}`;
        await socket.join(room);
        socket.to(room).emit('location:update', {
          tripId,
          lat,
          lng,
          userId: socket.data.userId,
          role: socket.data.role,
          timestamp: new Date().toISOString(),
        });
        acknowledge?.({ success: true });
      } catch (error) {
        acknowledge?.({ success: false, message: error.message });
      }
    });

    socket.on('chat:message', async (payload, acknowledge) => {
      try {
        const { tripId } = payload || {};
        const content = payload?.content?.trim();
        if (!content || content.length > 2000) throw new Error('Message must be between 1 and 2000 characters');
        const trip = await getTripForParticipant(tripId, socket.data.userId);
        if (!trip) throw new Error('Active trip not found or access denied');
        const message = await prisma.message.create({
          data: { tripId, senderId: socket.data.userId, content },
          include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
        });
        const room = `trip:${trip.id}`;
        await socket.join(room);
        io.to(room).emit('chat:message', message);
        const recipientId = trip.clientId === socket.data.userId ? trip.driverId : trip.clientId;
        if (recipientId) {
          await sendNotification({
            userId: recipientId,
            title: `رسالة جديدة من ${message.sender.name}`,
            body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
            type: 'CHAT_MESSAGE',
            data: { tripId },
          });
        }
        acknowledge?.({ success: true, data: message });
      } catch (error) {
        acknowledge?.({ success: false, message: error.message });
      }
    });
  });

  return io;
}
