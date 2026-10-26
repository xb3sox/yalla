import pool from '../../../src/config/database';
import privacyService from '../../../src/services/privacy.service';
import auditModel from '../../../src/models/audit.model';

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../../../src/models/audit.model', () => ({
  create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
}));

describe('PrivacyService', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should aggregate user personal data correctly without third-party PII', async () => {
      (pool.query as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes('FROM users')) {
          return Promise.resolve({
            rows: [
              {
                id: mockUserId,
                phone: '+966500000000',
                display_name: 'Test Participant',
                language: 'ar',
                preferred_area: 'riyadh',
                experience_language: 'ar',
                budget_min: 100,
                budget_max: 500,
                accessibility_needs: 'Wheelchair access',
                marketing_consent: true,
                created_at: new Date('2025-01-01'),
              },
            ],
          });
        }
        if (sql.includes('FROM reservations')) {
          return Promise.resolve({
            rows: [
              {
                id: 'res-1',
                experience_id: 'exp-1',
                title: 'Stargazing in AlUla',
                state: 'confirmed',
                payment_state: 'completed',
              },
            ],
          });
        }
        if (sql.includes('FROM payments')) {
          return Promise.resolve({
            rows: [
              {
                id: 'pay-1',
                reservation_id: 'res-1',
                amount: 250,
                status: 'completed',
              },
            ],
          });
        }
        if (sql.includes('FROM feedbacks')) {
          return Promise.resolve({
            rows: [
              {
                id: 'fb-1',
                reservation_id: 'res-1',
                worth_time: 5,
                comment: 'Great experience',
              },
            ],
          });
        }
        if (sql.includes('FROM rewards_ledger')) {
          return Promise.resolve({
            rows: [
              {
                id: 'rew-1',
                points: 50,
                type: 'earned',
              },
            ],
          });
        }
        if (sql.includes('FROM audit_events')) {
          return Promise.resolve({
            rows: [
              {
                id: 'aud-1',
                action: 'user_login',
              },
            ],
          });
        }
        if (sql.includes('FROM push_subscriptions')) {
          return Promise.resolve({
            rows: [
              {
                id: 'push-1',
                endpoint: 'https://push.example.com/sub-1',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await privacyService.exportUserData(mockUserId);

      expect(result).toHaveProperty('profile');
      expect(result.profile.id).toBe(mockUserId);
      expect(result.profile.display_name).toBe('Test Participant');
      expect(result.reservations).toHaveLength(1);
      expect(result.payments).toHaveLength(1);
      expect(result.feedback).toHaveLength(1);
      expect(result.rewards_ledger).toHaveLength(1);
      expect(result.audit_events).toHaveLength(1);
      expect(result.push_subscriptions).toHaveLength(1);
      expect(result).toHaveProperty('exported_at');
    });

    it('should throw error if user is not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(privacyService.exportUserData('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('anonymizeAndDeleteAccount', () => {
    it('should update users table, delete push subscriptions, clear notifications, and log audit event', async () => {
      const mockClient = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('UPDATE users')) {
            return Promise.resolve({ rowCount: 1, rows: [{ id: mockUserId }] });
          }
          return Promise.resolve({ rowCount: 1, rows: [] });
        }),
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await privacyService.anonymizeAndDeleteAccount(mockUserId, '192.168.1.1', 'participant');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SET display_name = 'Anonymized User'"),
        [mockUserId]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM push_subscriptions'),
        [mockUserId]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notifications'),
        [mockUserId]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      expect(auditModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: mockUserId,
          action: 'ACCOUNT_ERASURE',
          resource_type: 'user',
          resource_id: mockUserId,
        })
      );
    });

    it('should rollback transaction on failure', async () => {
      const mockClient = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('UPDATE users')) {
            return Promise.resolve({ rowCount: 0, rows: [] });
          }
          return Promise.resolve({ rowCount: 0, rows: [] });
        }),
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      await expect(
        privacyService.anonymizeAndDeleteAccount('unknown-user', '127.0.0.1')
      ).rejects.toThrow('User not found');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
