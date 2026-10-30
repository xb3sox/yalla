import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import logger from '../utils/logger';

export interface TokenMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_hash: string | null;
}

/**
 * Reason a refresh token was rejected. Distinguishing these lets callers log
 * and respond appropriately without leaking detail to the client.
 */
/**
 * Window after rotation during which a replayed token is treated as a benign
 * client race (two tabs, or a retried request) rather than theft.
 */
export const REUSE_GRACE_MS = 10_000;

export type RefreshRejection =
  | 'TOKEN_UNKNOWN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'TOKEN_REUSE_DETECTED';

export class RefreshTokenError extends Error {
  constructor(public readonly reason: RefreshRejection) {
    super(reason);
    this.name = 'RefreshTokenError';
  }
}

/**
 * Hashes a refresh token for storage.
 *
 * Only the hash is persisted: a database disclosure must not hand an attacker
 * usable session tokens. SHA-256 is sufficient here (unlike passwords) because
 * the input is a high-entropy signed JWT, not a guessable secret.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function expiresAtFromToken(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (decoded?.exp) return new Date(decoded.exp * 1000);
  // Fall back to a conservative 30-day window if the token is opaque.
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

class RefreshTokenModel {
  /**
   * Persist a newly issued refresh token.
   */
  async issue(userId: string, token: string, meta: TokenMetadata = {}): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        hashToken(token),
        expiresAtFromToken(token),
        meta.userAgent ?? null,
        meta.ipAddress ?? null,
      ]
    );
  }

  /**
   * Validate and single-use a refresh token, returning the owning user id.
   *
   * Rotation: a valid token is marked revoked and linked to its replacement, so
   * a replay of the old value is detectable. Reuse is treated as theft — every
   * active token for that user is revoked and the caller must re-authenticate.
   */
  async consume(token: string): Promise<string> {
    const tokenHash = hashToken(token);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT * FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
        [tokenHash]
      );

      const row = result.rows[0] as IssuedToken | undefined;
      if (!row) {
        await client.query('COMMIT');
        throw new RefreshTokenError('TOKEN_UNKNOWN');
      }

      if (row.revoked_at) {
        const revokedAgoMs = Date.now() - new Date(row.revoked_at).getTime();

        // Within the grace window this is a client race, not theft: the caller
        // already received a replacement. Reject without destroying the family.
        if (revokedAgoMs <= REUSE_GRACE_MS) {
          await client.query('COMMIT');
          throw new RefreshTokenError('TOKEN_REVOKED');
        }

        // A replay long after rotation means the token leaked. Fail closed and
        // revoke every active token for the user; they must sign in again.
        await client.query(
          `UPDATE refresh_tokens
              SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
            WHERE user_id = $1 AND revoked_at IS NULL`,
          [row.user_id]
        );
        await client.query('COMMIT');
        logger.warn('Refresh token reuse detected — all sessions revoked', {
          userId: row.user_id,
        });
        throw new RefreshTokenError('TOKEN_REUSE_DETECTED');
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        await client.query(
          `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
          [tokenHash]
        );
        await client.query('COMMIT');
        throw new RefreshTokenError('TOKEN_EXPIRED');
      }

      await client.query(
        `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
        [tokenHash]
      );
      await client.query('COMMIT');

      return row.user_id;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Transaction may already be closed by an explicit COMMIT.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Link a rotated token to its replacement for auditability.
   */
  async linkReplacement(previousToken: string, replacementToken: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens SET replaced_by_hash = $2 WHERE token_hash = $1`,
      [hashToken(previousToken), hashToken(replacementToken)]
    );
  }

  /**
   * Revoke a single token (logout for one device).
   */
  async revoke(token: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens
          SET revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(token)]
    );
  }

  /**
   * Revoke every active token for a user (logout everywhere, password change,
   * account deletion).
   */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await pool.query(
      `UPDATE refresh_tokens
          SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Housekeeping for expired rows; safe to call periodically.
   */
  async purgeExpired(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP`
    );
    const purged = result.rowCount ?? 0;
    if (purged > 0) logger.info('Purged expired refresh tokens', { purged });
    return purged;
  }
}

export default new RefreshTokenModel();
