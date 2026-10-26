import { Request, Response, NextFunction } from 'express';
import { routingStore } from '../config/database';
import logger from '../utils/logger';

// In-memory pin store with TTL (fallback or primary if Redis is unavailable)
const pinnedSessionsMemory = new Map<string, number>();

const PIN_TTL_MS = 5000;

export const pinSessionToPrimary = (identifier: string): void => {
  const expiresAt = Date.now() + PIN_TTL_MS;
  pinnedSessionsMemory.set(identifier, expiresAt);
  logger.debug(`Pinned session identifier ${identifier} to primary database pool for 5 seconds`);
};

export const isSessionPinned = (identifier: string): boolean => {
  const expiresAt = pinnedSessionsMemory.get(identifier);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    pinnedSessionsMemory.delete(identifier);
    return false;
  }
  return true;
};

export const clearExpiredSessionPins = (): void => {
  const now = Date.now();
  for (const [key, expiresAt] of pinnedSessionsMemory.entries()) {
    if (now > expiresAt) {
      pinnedSessionsMemory.delete(key);
    }
  }
};

// Periodically clean up memory map
setInterval(clearExpiredSessionPins, 30000).unref();

export const databaseRoutingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Determine session identifier (user ID from auth, or IP / session cookie)
  const userId = (req as any).user?.id || req.ip || 'anonymous';
  const sessionIdentifier = `session:pinned:${userId}`;

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  if (isMutation) {
    pinSessionToPrimary(sessionIdentifier);
    if ((req as any).user?.id) {
      pinSessionToPrimary(`session:pinned:${(req as any).user.id}`);
    }
  }

  // Check if session is currently pinned
  const pinned = isSessionPinned(sessionIdentifier) || ((req as any).user?.id ? isSessionPinned(`session:pinned:${(req as any).user.id}`) : false);

  // Run downstream handlers inside AsyncLocalStorage routingStore context
  routingStore.run({ isPinnedToPrimary: pinned, userId: (req as any).user?.id }, () => {
    // If request performs mutation in handler, intercept response finish to ensure late pin if user was authenticated during request
    res.on('finish', () => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
        const postUserId = (req as any).user?.id;
        if (postUserId) {
          pinSessionToPrimary(`session:pinned:${postUserId}`);
        }
      }
    });
    next();
  });
};
