# Sentinel — Security Notes

## 2026-10-08 - Prevent Prototype Pollution in Input Sanitization & Information Leakage in Health Checks

**Vulnerability:** Input sanitization middleware accepted `__proto__`, `constructor`, and `prototype` keys during recursive object parsing, allowing prototype pollution. Additionally, `healthCheck` attached raw database exception messages (`error.message`) to API responses when the DB connection failed, risking disclosure of database server details or credentials.
**Learning:** Generic recursive sanitizers in Express must explicitly strip object prototype keys using `Object.prototype.hasOwnProperty.call`. Health check endpoints must return generic status indicators without exposing internal exception messages.
**Prevention:** Always filter out `__proto__`, `constructor`, and `prototype` keys when recursing over untrusted input objects, and scrub internal exception messages from public health/monitoring responses.

## 2026-10-28 - Escape SQL LIKE Wildcards & Enforce Minimum Length in Prefix/PIN Matching

**Vulnerability:** Check-in PIN verification constructed SQL `ILIKE` patterns directly from unescaped user input (`${pin}%`). Passing wildcards like `%` or `_` or short inputs allowed matching arbitrary reservation IDs without knowing the user's actual PIN/reservation ID.
**Learning:** Even when using parameterized SQL queries, inserting user input into a `LIKE`/`ILIKE` pattern treats `%` and `_` as wildcard operators rather than literal characters.
**Prevention:** Always escape SQL `LIKE` special characters (`%`, `_`, `\`) with `replace(/[%_\\]/g, '\\$&')` when embedding user input in pattern queries, and validate input length prior to query construction.
