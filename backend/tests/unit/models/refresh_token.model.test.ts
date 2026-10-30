import refreshTokenModel, {
  hashToken,
  RefreshTokenError,
  REUSE_GRACE_MS,
} from '../../../src/models/refresh_token.model';
import pool from '../../../src/config/database';

jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: { query: jest.fn(), connect: jest.fn() },
}));

const mockPool = pool as unknown as {
  query: jest.Mock;
  connect: jest.Mock;
};

interface FakeRow {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_hash: string | null;
}

function mockClient(selectRows: FakeRow[]) {
  const client = {
    query: jest.fn().mockImplementation((sql: string) => {
      if (/^\s*SELECT/.test(sql)) return Promise.resolve({ rows: selectRows });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }),
    release: jest.fn(),
  };
  mockPool.connect.mockResolvedValue(client);
  return client;
}

function row(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    user_id: 'user-1',
    token_hash: hashToken('token-a'),
    expires_at: new Date(Date.now() + 60_000),
    revoked_at: null,
    replaced_by_hash: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('refresh token store', () => {
  describe('hashToken', () => {
    it('never stores the raw token', () => {
      const hash = hashToken('super-secret-token');
      expect(hash).toHaveLength(64);
      expect(hash).not.toContain('super-secret-token');
    });

    it('is deterministic', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });
  });

  describe('consume', () => {
    it('returns the owning user for a valid token and marks it revoked', async () => {
      const client = mockClient([row()]);

      await expect(refreshTokenModel.consume('token-a')).resolves.toBe('user-1');

      const writes = client.query.mock.calls
        .map((c: any[]) => c[0] as string)
        .filter((sql: string) => /UPDATE/.test(sql));
      expect(writes.some((sql: string) => /revoked_at = CURRENT_TIMESTAMP/.test(sql))).toBe(true);
    });

    it('rejects an unknown token', async () => {
      mockClient([]);
      await expect(refreshTokenModel.consume('nope')).rejects.toMatchObject({
        reason: 'TOKEN_UNKNOWN',
      });
    });

    it('rejects an expired token and revokes it', async () => {
      mockClient([row({ expires_at: new Date(Date.now() - 1000) })]);

      await expect(refreshTokenModel.consume('token-a')).rejects.toBeInstanceOf(RefreshTokenError);
      await expect(
        refreshTokenModel.consume('token-a').catch((e) => e.reason)
      ).resolves.toBe('TOKEN_EXPIRED');
    });

    it('treats a replay inside the grace window as a benign race', async () => {
      const client = mockClient([row({ revoked_at: new Date(Date.now() - 1_000) })]);

      await expect(refreshTokenModel.consume('token-a')).rejects.toMatchObject({
        reason: 'TOKEN_REVOKED',
      });

      // Must NOT revoke the whole family for a client race.
      const familyWide = client.query.mock.calls
        .map((c: any[]) => c[0] as string)
        .filter((sql: string) => /WHERE user_id = \$1 AND revoked_at IS NULL/.test(sql));
      expect(familyWide).toHaveLength(0);
    });

    it('revokes every session when a token is replayed long after rotation', async () => {
      const stale = new Date(Date.now() - REUSE_GRACE_MS - 60_000);
      const client = mockClient([row({ revoked_at: stale })]);

      await expect(refreshTokenModel.consume('token-a')).rejects.toMatchObject({
        reason: 'TOKEN_REUSE_DETECTED',
      });

      const familyWide = client.query.mock.calls
        .map((c: any[]) => c[0] as string)
        .filter((sql: string) => /WHERE user_id = \$1 AND revoked_at IS NULL/.test(sql));
      expect(familyWide).toHaveLength(1);
    });

    it('always releases the connection', async () => {
      const client = mockClient([row()]);
      await refreshTokenModel.consume('token-a');
      expect(client.release).toHaveBeenCalled();
    });

    it('releases the connection when the token is rejected', async () => {
      const client = mockClient([]);
      await expect(refreshTokenModel.consume('bad')).rejects.toThrow();
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe('revocation', () => {
    it('revoke() targets the hashed token, never the raw value', async () => {
      await refreshTokenModel.revoke('token-a');
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toMatch(/UPDATE refresh_tokens/);
      expect(params[0]).toBe(hashToken('token-a'));
      expect(params).not.toContain('token-a');
    });

    it('revokeAllForUser() scopes to active tokens for that user', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 3 });
      await expect(refreshTokenModel.revokeAllForUser('user-1')).resolves.toBe(3);
      const [sql, params] = mockPool.query.mock.calls[0];
      expect(sql).toMatch(/user_id = \$1 AND revoked_at IS NULL/);
      expect(params).toEqual(['user-1']);
    });
  });
});
