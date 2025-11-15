/**
 * Enhanced Logger Utility
 * Provides structured logging with levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  enableConsole: true,
  enableStorage: false,
  maxStoredLogs: 1000,
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Format log message for console output
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}] ` : '';
    return `${timestamp} [${entry.level.toUpperCase()}] ${context}${entry.message}`;
  }

  /**
   * Store log entry
   */
  private storeLog(entry: LogEntry): void {
    if (this.config.enableStorage) {
      this.logs.push(entry);
      
      // Trim logs if exceeding max
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs = this.logs.slice(-this.config.maxStoredLogs);
      }
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
    };

    this.storeLog(entry);

    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, data || '');
          break;
        case 'info':
          console.info(formattedMessage, data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, data || '');
          break;
        case 'error':
          console.error(formattedMessage, data || '');
          break;
      }
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('debug', message, context, data);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('info', message, context, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, context, data);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('error', message, context, data);
  }

  /**
   * Get stored logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Create a child logger with context
   */
  createChildLogger(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-aware logger that automatically includes context
 */
class ContextLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(message, this.context, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(message, this.context, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(message, this.context, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.parent.error(message, this.context, data);
  }
}

// Export singleton instance
export const logger = new Logger({
  level: (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'info',
  enableConsole: true,
  enableStorage: true,
});

// Export factory function for creating child loggers
export function createLogger(context: string): ContextLogger {
  return logger.createChildLogger(context);
}

// Export types and classes
export { Logger, ContextLogger };
