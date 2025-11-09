/**
 * Logging Utility for SkinTwin FormX
 * Provides structured logging with different log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] ${entry.level}: ${entry.message}${context}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error(error.stack);
        }
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log database operations
   */
  database(operation: string, details?: Record<string, unknown>): void {
    this.debug(`Database operation: ${operation}`, details);
  }

  /**
   * Log API calls
   */
  api(method: string, endpoint: string, details?: Record<string, unknown>): void {
    this.debug(`API ${method} ${endpoint}`, details);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, details?: Record<string, unknown>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, details);
  }
}

// Export singleton instance
export const logger = new Logger();

// Set log level from environment variable if available
if (typeof process !== 'undefined' && process.env.VITE_LOG_LEVEL) {
  const envLevel = process.env.VITE_LOG_LEVEL.toUpperCase() as LogLevel;
  if (Object.values(LogLevel).includes(envLevel)) {
    logger.setMinLevel(envLevel);
  }
}
