## 2026-10-07 - Prototype Pollution in Input Sanitization Middleware
**Vulnerability:** Recursive object traversal in input sanitization middleware iterated over object keys with `for (const key in obj)` without filtering `__proto__`, `constructor`, `prototype`, or checking `hasOwnProperty`, allowing attackers to pollute `Object.prototype`.
**Learning:** Generic recursive functions operating on untrusted request bodies/queries/params can accidentally trigger prototype pollution if special keys are copied directly onto new objects.
**Prevention:** Always check `key === '__proto__' || key === 'constructor' || key === 'prototype'` and `Object.prototype.hasOwnProperty.call(obj, key)` before copying keys in recursive object sanitizers/cloners.
