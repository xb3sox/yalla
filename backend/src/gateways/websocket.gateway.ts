import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import config from '../config';
import userModel from '../models/user.model';
import pool from '../config/database';
import ReservationModel from '../models/reservation.model';
import AuditModel from '../models/audit.model';
import logger from '../utils/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      userId: string;
      phone: string;
      role: string;
    };
    checkinTimestamps?: number[];
  };
}

export function initWebSocketGateway(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin || 'http://localhost:5173',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Optional Redis Adapter setup for multi-node scaling
  if (process.env.REDIS_URL || process.env.USE_REDIS_ADAPTER === 'true') {
    try {
      // Setup redis adapter if redis client available
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient } = require('redis');
      const pubClient = createClient({ url: config.redis.url });
      const subClient = pubClient.duplicate();
      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Redis adapter connected for Socket.IO');
      }).catch((err: any) => {
        logger.warn('Failed to connect Redis adapter for Socket.IO, falling back to memory adapter:', err.message);
      });
    } catch (err: any) {
      logger.warn('Redis adapter initialization skipped or failed:', err.message);
    }
  }

  // Handshake Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token as string;
      }

      if (!token) {
        return next(new Error('4001 Unauthorized'));
      }

      const decoded = userModel.verifyAccessToken(token);
      socket.data.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      };

      next();
    } catch (error: any) {
      logger.warn('WebSocket handshake authentication failed:', error.message);
      return next(new Error('4001 Unauthorized'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    logger.info('WebSocket client connected', { socketId: socket.id, userId: user?.userId });

    socket.data.checkinTimestamps = [];

    // Client joins experience roster room
    socket.on('client:join_roster', async (payload: { experienceId: string }) => {
      try {
        const { experienceId } = payload || {};
        if (!experienceId) {
          return socket.emit('server:error', { code: 400, message: 'experienceId is required' });
        }

        const userId = socket.data.user?.userId;
        const userRole = socket.data.user?.role;

        // Verify host authorization against experience ownership
        const expRes = await pool.query(
          'SELECT id, primary_host_id, backup_host_id FROM experiences WHERE id = $1',
          [experienceId]
        );

        if (expRes.rows.length === 0) {
          return socket.emit('server:error', { code: 404, message: 'Experience not found' });
        }

        const experience = expRes.rows[0];
        const isHost =
          experience.primary_host_id === userId ||
          experience.backup_host_id === userId ||
          userRole === 'staff' ||
          userRole === 'admin';

        if (!isHost) {
          logger.warn('Unauthorized join_roster attempt', { userId, experienceId });
          return socket.emit('server:error', { code: 403, message: 'Forbidden: Host authorization required' });
        }

        const room = `experience:${experienceId}:roster`;
        socket.join(room);

        // Send current roster snapshot to the connected client
        const roster = await ReservationModel.findByExperience(experienceId);
        socket.emit('server:roster_snapshot', { experienceId, roster });
      } catch (error: any) {
        logger.error('Error in client:join_roster handler:', error);
        socket.emit('server:error', { code: 500, message: 'Failed to join roster channel' });
      }
    });

    // Client checks in attendee via PIN
    socket.on('client:checkin_attendee', async (payload: { experienceId: string; reservationId?: string; pin: string }) => {
      try {
        const { experienceId, reservationId, pin } = payload || {};
        const userId = socket.data.user?.userId;
        const userRole = socket.data.user?.role || 'host';

        if (!experienceId || !pin) {
          return socket.emit('server:error', { code: 400, message: 'experienceId and pin are required' });
        }

        // Rate limiting check: 10 requests per 10 seconds per connection
        const now = Date.now();
        const timestamps = (socket.data.checkinTimestamps || []).filter(t => now - t < 10000);
        if (timestamps.length >= 10) {
          logger.warn('Check-in rate limit exceeded', { socketId: socket.id, userId });
          return socket.emit('server:error', {
            code: 429,
            message: 'Rate limit exceeded: Max 10 check-in attempts per 10 seconds',
          });
        }
        timestamps.push(now);
        socket.data.checkinTimestamps = timestamps;

        // Authorization check against experience ownership
        const expRes = await pool.query(
          'SELECT id, primary_host_id, backup_host_id FROM experiences WHERE id = $1',
          [experienceId]
        );

        if (expRes.rows.length === 0) {
          return socket.emit('server:error', { code: 404, message: 'Experience not found' });
        }

        const experience = expRes.rows[0];
        const isHost =
          experience.primary_host_id === userId ||
          experience.backup_host_id === userId ||
          userRole === 'staff' ||
          userRole === 'admin';

        if (!isHost) {
          logger.warn('Unauthorized checkin_attendee attempt', { userId, experienceId });
          return socket.emit('server:error', { code: 403, message: 'Forbidden: Host authorization required' });
        }

        // Find matching reservation
        let reservationQuery = '';
        let queryParams: any[] = [];

        if (reservationId) {
          reservationQuery = `
            SELECT r.*, u.display_name
            FROM reservations r
            JOIN users u ON r.participant_id = u.id
            WHERE r.id = $1 AND r.experience_id = $2
          `;
          queryParams = [reservationId, experienceId];
        } else {
          reservationQuery = `
            SELECT r.*, u.display_name
            FROM reservations r
            JOIN users u ON r.participant_id = u.id
            WHERE r.experience_id = $1 AND r.id::text ILIKE $2
            LIMIT 1
          `;
          queryParams = [experienceId, `${pin}%`];
        }

        const resResult = await pool.query(reservationQuery, queryParams);
        if (resResult.rows.length === 0) {
          return socket.emit('server:error', { code: 404, message: 'Invalid check-in PIN or reservation not found' });
        }

        const reservation = resResult.rows[0];

        // If reservationId was provided, also verify PIN
        if (reservationId && !reservation.id.toLowerCase().startsWith(pin.toLowerCase())) {
          return socket.emit('server:error', { code: 404, message: 'Invalid check-in PIN' });
        }

        // Transition reservation state via domain model (enforces state machine invariants)
        let updatedReservation;
        try {
          updatedReservation = await ReservationModel.updateState(reservation.id, 'checked_in');
        } catch (stateErr: any) {
          logger.warn('Invalid reservation state transition during check-in:', stateErr.message);
          return socket.emit('server:error', { code: 400, message: stateErr.message });
        }

        // Record audit event
        await AuditModel.create({
          actor_id: userId || 'unknown',
          actor_role: userRole,
          action: 'reservation_checked_in',
          resource_type: 'reservation',
          resource_id: reservation.id,
          details: { experience_id: experienceId, checked_in_by: userId },
          classification: 'confidential',
        });

        // Broadcast roster update to room without sensitive personal information
        const updatePayload = {
          experienceId,
          reservationId: updatedReservation.id,
          state: updatedReservation.state,
          checkedInAt: updatedReservation.checked_in_at
            ? new Date(updatedReservation.checked_in_at).toISOString()
            : new Date().toISOString(),
          checkedInBy: userId,
          attendeeName: reservation.display_name || 'Attendee',
        };

        const room = `experience:${experienceId}:roster`;
        io.to(room).emit('server:roster_updated', updatePayload);
      } catch (error: any) {
        logger.error('Error in client:checkin_attendee handler:', error);
        socket.emit('server:error', { code: 500, message: 'Failed to process check-in' });
      }
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id });
    });
  });

  return io;
}
