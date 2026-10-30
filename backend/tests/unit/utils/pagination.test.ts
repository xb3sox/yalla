import { toBoundedInt, parsePagination } from '../../../src/utils/pagination';

describe('toBoundedInt', () => {
  const bounds = { fallback: 50, min: 1, max: 100 };

  it('returns the fallback when the value is absent', () => {
    expect(toBoundedInt(undefined, bounds)).toBe(50);
    expect(toBoundedInt(null, bounds)).toBe(50);
    expect(toBoundedInt('', bounds)).toBe(50);
  });

  it('parses numeric strings', () => {
    expect(toBoundedInt('25', bounds)).toBe(25);
  });

  it('rejects non-numeric input instead of producing NaN', () => {
    expect(toBoundedInt('abc', bounds)).toBe(50);
    expect(toBoundedInt({}, bounds)).toBe(50);
  });

  it('clamps values below the minimum (negative limits are invalid SQL)', () => {
    expect(toBoundedInt('-10', bounds)).toBe(1);
    expect(toBoundedInt(-1, bounds)).toBe(1);
  });

  it('clamps values above the maximum to prevent unbounded page sizes', () => {
    expect(toBoundedInt('1000000', bounds)).toBe(100);
  });

  it('truncates fractional input', () => {
    expect(toBoundedInt('12.9', bounds)).toBe(12);
  });

  it('uses the first element when the query value is repeated', () => {
    expect(toBoundedInt(['7', '9'], bounds)).toBe(7);
  });

  it('supports Infinity-free upper bounds for offsets', () => {
    expect(toBoundedInt('9000', { fallback: 0, min: 0, max: Number.MAX_SAFE_INTEGER })).toBe(9000);
  });
});

describe('parsePagination', () => {
  it('applies sensible defaults', () => {
    expect(parsePagination({})).toEqual({ limit: 50, offset: 0 });
  });

  it('honours custom defaults and maximums', () => {
    expect(parsePagination({}, { defaultLimit: 20, maxLimit: 50 }).limit).toBe(20);
    expect(parsePagination({ limit: '500' }, { maxLimit: 50 }).limit).toBe(50);
  });

  it('never returns a negative offset', () => {
    expect(parsePagination({ offset: '-5' }).offset).toBe(0);
  });

  it('tolerates an undefined query object', () => {
    expect(parsePagination(undefined)).toEqual({ limit: 50, offset: 0 });
  });
});
