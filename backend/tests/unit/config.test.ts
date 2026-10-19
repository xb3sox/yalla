import { loadConfig } from '../../src/config';

describe('Configuration Loader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Development Environment', () => {
    it('should use fallback secrets when environment variables are not provided in development', () => {
      const config = loadConfig({
        NODE_ENV: 'development',
      });

      expect(config.env).toBe('development');
      expect(config.jwt.secret).toBe('your-super-secret-jwt-key-change-in-production');
      expect(config.jwt.refreshSecret).toBe('your-super-secret-refresh-key-change-in-production');
      expect(config.security.sessionSecret).toBe('your-session-secret-change-in-production');
    });

    it('should use custom environment secrets when provided in development', () => {
      const config = loadConfig({
        NODE_ENV: 'development',
        JWT_SECRET: 'custom-dev-jwt-secret',
        JWT_REFRESH_SECRET: 'custom-dev-refresh-secret',
        SESSION_SECRET: 'custom-dev-session-secret',
      });

      expect(config.jwt.secret).toBe('custom-dev-jwt-secret');
      expect(config.jwt.refreshSecret).toBe('custom-dev-refresh-secret');
      expect(config.security.sessionSecret).toBe('custom-dev-session-secret');
    });
  });

  describe('Production Environment Fail Fast', () => {
    it('should throw error if JWT_SECRET is missing in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_REFRESH_SECRET: 'prod-refresh-secret-12345',
          SESSION_SECRET: 'prod-session-secret-12345',
        });
      }).toThrow('JWT_SECRET must be set to a secure secret in production');
    });

    it('should throw error if JWT_SECRET is set to the default insecure fallback in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
          JWT_REFRESH_SECRET: 'prod-refresh-secret-12345',
          SESSION_SECRET: 'prod-session-secret-12345',
        });
      }).toThrow('JWT_SECRET must be set to a secure secret in production');
    });

    it('should throw error if JWT_REFRESH_SECRET is missing in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'prod-jwt-secret-12345',
          SESSION_SECRET: 'prod-session-secret-12345',
        });
      }).toThrow('JWT_REFRESH_SECRET must be set to a secure secret in production');
    });

    it('should throw error if SESSION_SECRET is missing in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'prod-jwt-secret-12345',
          JWT_REFRESH_SECRET: 'prod-refresh-secret-12345',
        });
      }).toThrow('SESSION_SECRET must be set to a secure secret in production');
    });

    it('should throw error if DATABASE_URL is missing or local in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'prod-jwt-secret-12345',
          JWT_REFRESH_SECRET: 'prod-refresh-secret-12345',
          SESSION_SECRET: 'prod-session-secret-12345',
        });
      }).toThrow('DATABASE_URL must be configured with a production database URI');
    });

    it('should aggregate multiple validation errors in production', () => {
      expect(() => {
        loadConfig({
          NODE_ENV: 'production',
        });
      }).toThrow(/JWT_SECRET must be set.*JWT_REFRESH_SECRET must be set.*SESSION_SECRET must be set.*DATABASE_URL must be configured/s);
    });

    it('should succeed in production when all secrets are properly provided', () => {
      const config = loadConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'secure-prod-jwt-secret-value-12345',
        JWT_REFRESH_SECRET: 'secure-prod-jwt-refresh-secret-value-12345',
        SESSION_SECRET: 'secure-prod-session-secret-value-12345',
        DATABASE_URL: 'postgresql://postgres:prodpassword@db.prod.internal:5432/yalla_prod',
      });

      expect(config.env).toBe('production');
      expect(config.jwt.secret).toBe('secure-prod-jwt-secret-value-12345');
      expect(config.jwt.refreshSecret).toBe('secure-prod-jwt-refresh-secret-value-12345');
      expect(config.security.sessionSecret).toBe('secure-prod-session-secret-value-12345');
      expect(config.database.url).toBe('postgresql://postgres:prodpassword@db.prod.internal:5432/yalla_prod');
    });
  });
});
