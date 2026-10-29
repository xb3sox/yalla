import http from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { initWebSocketGateway } from '../../../src/gateways/websocket.gateway';
import userModel from '../../../src/models/user.model';
import ReservationModel from '../../../src/models/reservation.model';
import AuditModel from '../../../src/models/audit.model';
import pool from '../../../src/config/database';

jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/reservation.model');
jest.mock('../../../src/models/audit.model');
jest.mock('../../../src/config/database');

describe('WebSocketGateway Unit Tests', () => {
  let httpServer: http.Server;
  let serverPort: number;
  let clientSocket: ClientSocket;

  beforeAll((done) => {
    httpServer = http.createServer();
    initWebSocketGateway(httpServer);
    httpServer.listen(() => {
      serverPort = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    httpServer.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Authentication Handshake', () => {
    it('should reject connection when no token is provided', (done) => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect_error', (err) => {
        expect(err.message).toContain('4001 Unauthorized');
        done();
      });
    });

    it('should reject connection when token is invalid', (done) => {
      (userModel.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'invalid_token' },
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect_error', (err) => {
        expect(err.message).toContain('4001 Unauthorized');
        done();
      });
    });

    it('should accept connection when valid JWT token is provided', (done) => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'usr_host_01',
        phone: '+966500000000',
        role: 'host',
      });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });
  });

  describe('Roster Channel Isolation & Authorization', () => {
    beforeEach(() => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'usr_host_01',
        phone: '+966500000000',
        role: 'host',
      });
    });

    it('should reject join_roster if experience is not found', (done) => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('client:join_roster', { experienceId: 'exp_nonexistent' });
      });

      clientSocket.on('server:error', (err) => {
        expect(err.code).toBe(404);
        expect(err.message).toContain('Experience not found');
        done();
      });
    });

    it('should reject join_roster if user is not primary or backup host', (done) => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'exp_123', primary_host_id: 'usr_other_host', backup_host_id: 'usr_backup' }],
      });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('client:join_roster', { experienceId: 'exp_123' });
      });

      clientSocket.on('server:error', (err) => {
        expect(err.code).toBe(403);
        expect(err.message).toContain('Host authorization required');
        done();
      });
    });

    it('should allow primary_host_id to join roster channel and receive snapshot', (done) => {
      const mockRoster = [{ id: 'res_67890', state: 'confirmed' }];
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'exp_123', primary_host_id: 'usr_host_01', backup_host_id: 'usr_backup' }],
      });
      (ReservationModel.findByExperience as jest.Mock).mockResolvedValue(mockRoster);

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('client:join_roster', { experienceId: 'exp_123' });
      });

      clientSocket.on('server:roster_snapshot', (payload) => {
        expect(payload.experienceId).toBe('exp_123');
        done();
      });
    });
  });

  describe('Check-In Events & Domain Model Invocation', () => {
    beforeEach(() => {
      (userModel.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 'usr_host_01',
        phone: '+966500000000',
        role: 'host',
      });
    });

    it('should check in attendee with valid PIN, invoke ReservationModel.updateState, record audit, and broadcast server:roster_updated', (done) => {
      const mockExperience = { id: 'exp_123', primary_host_id: 'usr_host_01' };
      const mockReservation = { id: 'res_67890123', state: 'confirmed', display_name: 'Sarah A.' };
      const mockUpdated = { id: 'res_67890123', state: 'checked_in', checked_in_at: new Date() };

      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('FROM experiences')) {
          return Promise.resolve({ rows: [mockExperience] });
        }
        if (query.includes('FROM reservations')) {
          return Promise.resolve({ rows: [mockReservation] });
        }
        return Promise.resolve({ rows: [] });
      });

      (ReservationModel.updateState as jest.Mock).mockResolvedValue(mockUpdated);
      (AuditModel.create as jest.Mock).mockResolvedValue({ id: 'audit_1' });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('client:join_roster', { experienceId: 'exp_123' });
        clientSocket.emit('client:checkin_attendee', {
          experienceId: 'exp_123',
          pin: 'res_6789',
        });
      });

      clientSocket.on('server:roster_updated', (payload) => {
        expect(payload.experienceId).toBe('exp_123');
        expect(payload.reservationId).toBe('res_67890123');
        expect(payload.state).toBe('checked_in');
        expect(payload.checkedInBy).toBe('usr_host_01');
        expect(payload.attendeeName).toBe('Sarah A.');

        expect(ReservationModel.updateState).toHaveBeenCalledWith('res_67890123', 'checked_in');
        expect(AuditModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            actor_id: 'usr_host_01',
            action: 'reservation_checked_in',
            resource_id: 'res_67890123',
          })
        );
        done();
      });
    });

    it('should emit targeted server:error when PIN is invalid and NOT broadcast to room', (done) => {
      const mockExperience = { id: 'exp_123', primary_host_id: 'usr_host_01' };

      (pool.query as jest.Mock).mockImplementation((query: string) => {
        if (query.includes('FROM experiences')) {
          return Promise.resolve({ rows: [mockExperience] });
        }
        if (query.includes('FROM reservations')) {
          return Promise.resolve({ rows: [] }); // No reservation matches PIN
        }
        return Promise.resolve({ rows: [] });
      });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      let broadcastReceived = false;
      clientSocket.on('server:roster_updated', () => {
        broadcastReceived = true;
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('client:checkin_attendee', {
          experienceId: 'exp_123',
          pin: 'wrong_pin',
        });
      });

      clientSocket.on('server:error', (err) => {
        expect(err.code).toBe(404);
        expect(err.message).toContain('Invalid check-in PIN');
        setTimeout(() => {
          expect(broadcastReceived).toBe(false);
          done();
        }, 50);
      });
    });

    it('should enforce rate limiting of 10 requests per 10 seconds per host socket connection', (done) => {
      const mockExperience = { id: 'exp_123', primary_host_id: 'usr_host_01' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockExperience] });

      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: 'valid_jwt_token' },
        transports: ['websocket'],
      });

      let errorReceived = false;
      clientSocket.on('server:error', (err) => {
        if (err.code === 429 && !errorReceived) {
          errorReceived = true;
          expect(err.message).toContain('Rate limit exceeded');
          done();
        }
      });

      clientSocket.on('connect', () => {
        for (let i = 0; i < 12; i++) {
          clientSocket.emit('client:checkin_attendee', {
            experienceId: 'exp_123',
            pin: `pin_${i}`,
          });
        }
      });
    });
  });
});
