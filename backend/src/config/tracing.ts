import * as Sentry from '@sentry/node';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { Sampler, SamplingResult, SamplingDecision } from '@opentelemetry/sdk-trace-base';

/**
 * Node.js Preload Requirement:
 * Production start command MUST preload this tracing file before app modules are loaded:
 * `node --require ./dist/config/tracing.js dist/server.js`
 * This ensures OpenTelemetry auto-instrumentation intercepts Express and pg modules
 * before ESM/TS hoisting occurs.
 */

const SENSITIVE_KEYS = ['password', 'cardnumber', 'cvv', 'jwt', 'token'];

function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

// Custom OpenTelemetry Sampler to exclude noise routes (/health and /metrics)
class HealthMetricsExcludingSampler implements Sampler {
  shouldSample(_context: any, _traceId: string, _spanName: string, _spanKind: any, attributes: any): SamplingResult {
    const httpTarget = attributes?.['http.target'] || attributes?.['http.route'] || attributes?.['url.path'] || '';
    if (typeof httpTarget === 'string' && (httpTarget.includes('/health') || httpTarget.includes('/metrics'))) {
      return { decision: SamplingDecision.NOT_RECORD };
    }
    return { decision: SamplingDecision.RECORD_AND_SAMPLED };
  }

  toString(): string {
    return 'HealthMetricsExcludingSampler';
  }
}

// Initialize Sentry Node SDK
if (process.env.SENTRY_DSN || process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://exampleDSN@o0.ingest.sentry.io/0',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          event.request.headers = sanitizeData(event.request.headers);
        }
        if (event.request.data) {
          event.request.data = sanitizeData(event.request.data);
        }
      }
      if (event.extra) {
        event.extra = sanitizeData(event.extra);
      }
      return event;
    },
  });
}

// Initialize OpenTelemetry Provider with instrumentations
export const provider = new NodeTracerProvider({
  sampler: new HealthMetricsExcludingSampler(),
});

const expressInstrumentation = new ExpressInstrumentation();
const pgInstrumentation = new PgInstrumentation();

expressInstrumentation.setTracerProvider(provider);
pgInstrumentation.setTracerProvider(provider);

expressInstrumentation.enable();
pgInstrumentation.enable();

provider.register();

console.log('OpenTelemetry tracing initialized successfully.');

process.on('SIGTERM', () => {
  provider.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error: unknown) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
