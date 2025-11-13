/**
 * Centralized logging utility
 * Replaces scattered console.log/error/warn statements
 * Provides structured logging with levels and metadata
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogMeta {
  [key: string]: unknown;
}

export interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  timestamp: string;
  meta?: LogMeta;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logs: LogEntry[] = [];

  private constructor(logLevel: LogLevel = LogLevel.INFO, enableConsole: boolean = true) {
    this.logLevel = logLevel;
    this.enableConsole = enableConsole;
  }

  /**
   * Get singleton logger instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      // Read log level from env
      const levelStr = process.env.LOG_LEVEL || 'info';
      const level = Logger.parseLogLevel(levelStr);
      Logger.instance = new Logger(level, process.env.NODE_ENV !== 'test');
    }
    return Logger.instance;
  }

  /**
   * Parse log level from string
   */
  private static parseLogLevel(level: string): LogLevel {
    const normalized = level.toUpperCase();
    if (normalized in LogLevel) {
      return LogLevel[normalized as keyof typeof LogLevel];
    }
    return LogLevel.INFO;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable/disable console output
   */
  setConsoleOutput(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: keyof typeof LogLevel,
    message: string,
    meta?: LogMeta,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (meta) {
      entry.meta = meta;
    }

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Write log entry
   */
  private write(entry: LogEntry): void {
    const levelValue = LogLevel[entry.level];

    if (levelValue < this.logLevel) {
      return; // Skip if below configured log level
    }

    // Store in memory (circular buffer, keep last 1000)
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    // Output to console if enabled
    if (this.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'DEBUG':
      case 'INFO':
        console.log(message, entry.meta || '');
        break;
      case 'WARN':
        console.warn(message, entry.meta || '');
        break;
      case 'ERROR':
        console.error(message, entry.error || entry.meta || '');
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, meta?: LogMeta): void {
    this.write(this.createEntry('DEBUG', message, meta));
  }

  /**
   * Info level logging
   */
  info(message: string, meta?: LogMeta): void {
    this.write(this.createEntry('INFO', message, meta));
  }

  /**
   * Warning level logging
   */
  warn(message: string, meta?: LogMeta): void {
    this.write(this.createEntry('WARN', message, meta));
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, meta?: LogMeta): void {
    this.write(this.createEntry('ERROR', message, meta, error));
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs matching criteria
   */
  getLogs(filter?: { level?: keyof typeof LogLevel; since?: Date }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.since) {
      const sinceTime = filter.since.getTime();
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= sinceTime);
    }

    return filtered;
  }
}

/**
 * Export convenience instance
 */
export const logger = Logger.getInstance();

/**
 * Convenience functions
 */
export const debug = (message: string, meta?: LogMeta) => logger.debug(message, meta);
export const info = (message: string, meta?: LogMeta) => logger.info(message, meta);
export const warn = (message: string, meta?: LogMeta) => logger.warn(message, meta);
export const error = (message: string, err?: Error, meta?: LogMeta) =>
  logger.error(message, err, meta);
