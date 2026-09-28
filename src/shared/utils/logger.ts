/**
 * Logging Utilities
 * 
 * Provides structured logging with different levels.
 * In production, this would integrate with a logging service.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * Logger class
 */
class Logger {
  private enabled: boolean = true;
  private minLevel: LogLevel = 'info';

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enabled && this.LOG_LEVELS[level] >= this.LOG_LEVELS[this.minLevel];
  }

  /**
   * Format log entry
   */
  private formatEntry(entry: LogEntry): string {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` Error: ${entry.error.message}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    };

    console.debug(this.formatEntry(entry));
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    console.info(this.formatEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };

    console.warn(this.formatEntry(entry));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      error,
    };

    console.error(this.formatEntry(entry));
  }

  /**
   * Log with specific level
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    switch (level) {
      case 'debug':
        this.debug(message, context);
        break;
      case 'info':
        this.info(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'error':
        this.error(message, undefined, context);
        break;
    }
  }

  /**
   * Create child logger with context
   */
  child(context: Record<string, unknown>): Pick<Logger, 'debug' | 'info' | 'warn' | 'error'> {
    return {
      debug: (message: string, additionalContext?: Record<string, unknown>) =>
        this.debug(message, { ...context, ...additionalContext }),
      info: (message: string, additionalContext?: Record<string, unknown>) =>
        this.info(message, { ...context, ...additionalContext }),
      warn: (message: string, additionalContext?: Record<string, unknown>) =>
        this.warn(message, { ...context, ...additionalContext }),
      error: (message: string, error?: Error, additionalContext?: Record<string, unknown>) =>
        this.error(message, error, { ...context, ...additionalContext }),
    };
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export Logger class for testing
export { Logger };
