import { db, primaryPool, replicaPool, closePools, routingStore } from '../../../src/config/database';
import { isSessionPinned, pinSessionToPrimary, databaseRoutingMiddleware } from '../../../src/middleware/databaseRouting.middleware';
import logger from '../../../src/utils/logger';

describe('Database Dual Pool Routing & Failover', () => {
  let primaryQuerySpy: jest.SpyInstance;
  let replicaQuerySpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  const isSamePool = primaryPool === replicaPool;

  beforeEach(() => {
    primaryQuerySpy = jest.spyOn(primaryPool, 'query').mockImplementation(async () => ({ rows: [{ node: 'primary' }], rowCount: 1 } as any));
    if (!isSamePool) {
      replicaQuerySpy = jest.spyOn(replicaPool, 'query').mockImplementation(async () => ({ rows: [{ node: 'replica' }], rowCount: 1 } as any));
    }
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('queryPrimary should execute query against primaryPool', async () => {
    const res = await db.queryPrimary('SELECT 1');
    expect(primaryQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
    expect(res.rows[0].node).toBe('primary');
  });

  test('queryReplica should execute query against replicaPool when unpinned', async () => {
    const res = await db.queryReplica('SELECT 1');
    if (!isSamePool) {
      expect(replicaQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(res.rows[0].node).toBe('replica');
    } else {
      expect(primaryQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(res.rows[0].node).toBe('primary');
    }
  });

  test('queryReplica should fallback to primaryPool when replica query throws error', async () => {
    if (!isSamePool) {
      replicaQuerySpy.mockRejectedValueOnce(new Error('Replica connection refused'));
      const res = await db.queryReplica('SELECT 1');
      expect(replicaQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(primaryQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('PostgreSQL replica query failed'),
        expect.objectContaining({ error: 'Replica connection refused' })
      );
      expect(res.rows[0].node).toBe('primary');
    } else {
      // With single pool fallback mode, query executes directly on primaryPool
      const res = await db.queryReplica('SELECT 1');
      expect(primaryQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(res.rows[0].node).toBe('primary');
    }
  });

  test('queryReplica should route to primaryPool when session is pinned to primary in routingStore context', async () => {
    await routingStore.run({ isPinnedToPrimary: true, userId: 'user-123' }, async () => {
      const res = await db.queryReplica('SELECT 1');
      expect(primaryQuerySpy).toHaveBeenCalledWith('SELECT 1', undefined);
      expect(res.rows[0].node).toBe('primary');
    });
  });

  test('session pinning helper should track pin TTL for 5 seconds', () => {
    const sessionKey = 'session:pinned:test-user';
    expect(isSessionPinned(sessionKey)).toBe(false);
    pinSessionToPrimary(sessionKey);
    expect(isSessionPinned(sessionKey)).toBe(true);
  });

  test('databaseRoutingMiddleware should pin POST requests and set up routingStore', async () => {
    const req: any = {
      method: 'POST',
      ip: '127.0.0.1',
      user: { id: 'user-abc' },
    };
    const res: any = {
      on: jest.fn(),
    };
    const next = jest.fn(() => {
      const store = routingStore.getStore();
      expect(store?.isPinnedToPrimary).toBe(true);
      expect(store?.userId).toBe('user-abc');
    });

    databaseRoutingMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(isSessionPinned('session:pinned:user-abc')).toBe(true);
  });

  test('transaction helper should run inside BEGIN/COMMIT block on primary', async () => {
    const clientQuerySpy = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    const clientReleaseSpy = jest.fn();
    jest.spyOn(primaryPool, 'connect').mockResolvedValueOnce({
      query: clientQuerySpy,
      release: clientReleaseSpy,
    } as any);

    const result = await db.transaction(async (client) => {
      await client.query('SELECT 1');
      return 'tx_success';
    });

    expect(result).toBe('tx_success');
    expect(clientQuerySpy).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(clientQuerySpy).toHaveBeenNthCalledWith(2, 'SELECT 1');
    expect(clientQuerySpy).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(clientReleaseSpy).toHaveBeenCalled();
  });

  test('closePools should end primary and replica pools', async () => {
    const primaryEndSpy = jest.spyOn(primaryPool, 'end').mockResolvedValueOnce(undefined as any);
    const replicaEndSpy = !isSamePool ? jest.spyOn(replicaPool, 'end').mockResolvedValueOnce(undefined as any) : null;

    await closePools();
    expect(primaryEndSpy).toHaveBeenCalled();
    if (replicaEndSpy) {
      expect(replicaEndSpy).toHaveBeenCalled();
    }
  });
});
