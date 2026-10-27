## 2026-10-27 - Information Leakage in Webhook Error Responses
**Vulnerability:** Stripe webhook failure handler attached `error.message` directly to public 400 Bad Request HTTP responses when event construction failed, exposing raw signature verification errors or secret details to external clients.
**Learning:** Public webhook endpoints must return generic error messages on validation failure to avoid leaking internal error strings, while logging full error details internally for diagnostic purposes.
**Prevention:** Scrub exception messages (`error.message`) from HTTP error payloads in unauthenticated public endpoints like webhooks.

## 2026-10-08 - Prevent Prototype Pollution in Input Sanitization & Information Leakage in Health Checks
**Vulnerability:** Input sanitization middleware accepted `__proto__`, `constructor`, and `prototype` keys during recursive object parsing, allowing prototype pollution. Additionally, `healthCheck` attached raw database exception messages (`error.message`) to API responses when the DB connection failed, risking disclosure of database server details or credentials.
**Learning:** Generic recursive sanitizers in Express must explicitly strip object prototype keys using `Object.prototype.hasOwnProperty.call`. Health check endpoints must return generic status indicators without exposing internal exception messages.
**Prevention:** Always filter out `__proto__`, `constructor`, and `prototype` keys when recursing over untrusted input objects, and scrub internal exception messages from public health/monitoring responses.
