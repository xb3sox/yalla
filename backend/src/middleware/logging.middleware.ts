import { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';

const SENSITIVE_KEYS = ['password', 'cardnumber', 'cvv', 'jwt', 'token'];

/**
 * Recursively masks sensitive parameters from objects or arrays
 */
export function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const redacted: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redacted[key] = redactSensitiveData(obj[key]);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
}

/**
 * Structured logging and W3C traceparent/traceresponse propagation middleware
 */
export const structuredLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Extract or attach OpenTelemetry active span trace context
  const activeSpan = trace.getSpan(context.active());
  const spanContext = activeSpan?.spanContext();

  const traceId = spanContext?.traceId || (req.headers['x-trace-id'] as string) || 'none';
  const spanId = spanContext?.spanId || 'none';

  // Attach standard W3C traceparent & traceresponse headers to response
  const traceparentHeader = `00-${traceId}-${spanId}-01`;
  res.setHeader('traceparent', traceparentHeader);
  res.setHeader('traceresponse', traceparentHeader);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'anonymous';
    const sanitizedBody = req.body ? redactSensitiveData(req.body) : undefined;

    const logEntry = {
      timestamp: new Date().toISOString(),
      trace_id: traceId,
      span_id: spanId,
      user_id: userId,
      http_status: res.statusCode,
      duration_ms: durationMs,
      route: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      body: sanitizedBody,
    };

    // Emit structured JSON log
    console.log(JSON.stringify(logEntry));
  });

  next();
};
