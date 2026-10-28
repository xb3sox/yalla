/**
 * Pagination and query-parameter parsing helpers.
 *
 * Untrusted query strings previously flowed straight into SQL LIMIT/OFFSET
 * clauses, which allowed negative values (database errors), non-numeric values
 * (NaN), and unbounded page sizes (memory/DB exhaustion). Every controller
 * should read paging parameters through this module.
 */

export interface Pagination {
  limit: number;
  offset: number;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Coerce a query value into an integer within an inclusive range.
 * Returns the fallback when the value is missing, non-numeric, or not finite.
 */
export function toBoundedInt(
  value: unknown,
  { fallback, min, max }: { fallback: number; min: number; max: number }
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === '') return fallback;

  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/**
 * Parse `limit`/`offset` query parameters into safe, non-negative integers.
 */
export function parsePagination(
  query: Record<string, unknown> = {},
  { defaultLimit = 50, maxLimit = 100 }: PaginationOptions = {}
): Pagination {
  return {
    limit: toBoundedInt(query.limit, { fallback: defaultLimit, min: 1, max: maxLimit }),
    offset: toBoundedInt(query.offset, { fallback: 0, min: 0, max: Number.MAX_SAFE_INTEGER }),
  };
}
