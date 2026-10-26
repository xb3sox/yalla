import { Request, Response } from 'express';
import { redactSensitiveData, structuredLogger } from '../../../src/middleware/logging.middleware';

describe('Structured Logging Middleware & Data Redaction', () => {
  describe('redactSensitiveData', () => {
    it('should mask sensitive keys in request body', () => {
      const input = {
        username: 'yalla_user',
        password: 'SecretPassword123!',
        cardNumber: '4111111111111111',
        cvv: '123',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token: 'sample-token-xyz',
        nested: {
          password: 'nested-pass',
          normalField: 'ok',
        },
      };

      const redacted = redactSensitiveData(input);

      expect(redacted.username).toBe('yalla_user');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.cardNumber).toBe('[REDACTED]');
      expect(redacted.cvv).toBe('[REDACTED]');
      expect(redacted.jwt).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.nested.password).toBe('[REDACTED]');
      expect(redacted.nested.normalField).toBe('ok');
    });

    it('should handle arrays with sensitive objects', () => {
      const input = [
        { key: 'item1', token: 'token123' },
        { key: 'item2', password: 'pass' },
      ];

      const redacted = redactSensitiveData(input);

      expect(redacted[0].key).toBe('item1');
      expect(redacted[0].token).toBe('[REDACTED]');
      expect(redacted[1].password).toBe('[REDACTED]');
    });

    it('should safely pass through non-object inputs', () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
      expect(redactSensitiveData('simple-string')).toBe('simple-string');
      expect(redactSensitiveData(12345)).toBe(12345);
    });
  });

  describe('structuredLogger middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let finishCallback: () => void;
    let setHeaderMock: jest.Mock;

    beforeEach(() => {
      setHeaderMock = jest.fn();
      next = jest.fn();
      req = {
        method: 'POST',
        url: '/api/v1/auth/login',
        originalUrl: '/api/v1/auth/login',
        headers: {},
        ip: '127.0.0.1',
        body: {
          username: 'testuser',
          password: 'supersecretpassword',
        },
      };

      res = {
        statusCode: 200,
        setHeader: setHeaderMock,
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'finish') {
            finishCallback = cb;
          }
          return res as Response;
        }),
      };
    });

    it('should set W3C traceparent and traceresponse headers on response', () => {
      structuredLogger(req as Request, res as Response, next);

      expect(setHeaderMock).toHaveBeenCalledWith('traceparent', expect.stringMatching(/^00-.+-01$/));
      expect(setHeaderMock).toHaveBeenCalledWith('traceresponse', expect.stringMatching(/^00-.+-01$/));
      expect(next).toHaveBeenCalled();
    });

    it('should log structured JSON on response finish with redacted body', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      structuredLogger(req as Request, res as Response, next);
      expect(finishCallback).toBeDefined();

      finishCallback();

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        http_status: 200,
        route: '/api/v1/auth/login',
        method: 'POST',
        user_id: 'anonymous',
      });

      expect(loggedData.body.username).toBe('testuser');
      expect(loggedData.body.password).toBe('[REDACTED]');
      expect(loggedData.duration_ms).toBeGreaterThanOrEqual(0);

      consoleLogSpy.mockRestore();
    });
  });
});
