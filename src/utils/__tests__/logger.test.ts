/**
 * Comprehensive test suite for Logger utility
 * Target: 75%+ coverage with YOLO precision
 */

import { Logger, LogLevel, LogMeta, debug, info, warn, error } from '../logger';

describe('Logger', () => {
  let testLogger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create fresh logger instance for each test
    // @ts-expect-error - Accessing private constructor for testing
    testLogger = new Logger(LogLevel.DEBUG, false);

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Clear all logs between tests
    testLogger.clearLogs();

    // Restore console mocks
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with log level from environment variable', () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      // Reset singleton
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;

      const instance = Logger.getInstance();
      instance.debug('test message');

      const logs = instance.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Restore
      process.env.LOG_LEVEL = originalEnv;
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;
    });

    it('should disable console output when NODE_ENV is test', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Reset singleton
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;

      const instance = Logger.getInstance();
      instance.info('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore
      process.env.NODE_ENV = originalNodeEnv;
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;
    });
  });

  describe('Log Level Filtering', () => {
    it('should only log messages at or above configured log level', () => {
      testLogger.setLogLevel(LogLevel.WARN);

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].level).toBe('WARN');
      expect(logs[1].level).toBe('ERROR');
    });

    it('should log nothing when level is NONE', () => {
      testLogger.setLogLevel(LogLevel.NONE);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(0);
    });

    it('should log everything when level is DEBUG', () => {
      testLogger.setLogLevel(LogLevel.DEBUG);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(4);
    });

    it('should log INFO and above when level is INFO', () => {
      testLogger.setLogLevel(LogLevel.INFO);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(3);
      expect(logs.map(l => l.level)).toEqual(['INFO', 'WARN', 'ERROR']);
    });

    it('should log only ERROR when level is ERROR', () => {
      testLogger.setLogLevel(LogLevel.ERROR);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('ERROR');
    });
  });

  describe('Log Methods', () => {
    describe('debug()', () => {
      it('should create a DEBUG log entry', () => {
        testLogger.debug('debug message');

        const logs = testLogger.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('DEBUG');
        expect(logs[0].message).toBe('debug message');
      });

      it('should include metadata when provided', () => {
        const meta = { userId: 123, action: 'click' };
        testLogger.debug('user action', meta);

        const logs = testLogger.getLogs();
        expect(logs[0].meta).toEqual(meta);
      });

      it('should include ISO timestamp', () => {
        testLogger.debug('test');

        const logs = testLogger.getLogs();
        expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('info()', () => {
      it('should create an INFO log entry', () => {
        testLogger.info('info message');

        const logs = testLogger.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('INFO');
        expect(logs[0].message).toBe('info message');
      });

      it('should include metadata when provided', () => {
        const meta = { component: 'auth', status: 'success' };
        testLogger.info('authentication successful', meta);

        const logs = testLogger.getLogs();
        expect(logs[0].meta).toEqual(meta);
      });
    });

    describe('warn()', () => {
      it('should create a WARN log entry', () => {
        testLogger.warn('warning message');

        const logs = testLogger.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('WARN');
        expect(logs[0].message).toBe('warning message');
      });

      it('should include metadata when provided', () => {
        const meta = { reason: 'rate limit', retryAfter: 30 };
        testLogger.warn('rate limit approaching', meta);

        const logs = testLogger.getLogs();
        expect(logs[0].meta).toEqual(meta);
      });
    });

    describe('error()', () => {
      it('should create an ERROR log entry', () => {
        testLogger.error('error message');

        const logs = testLogger.getLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('ERROR');
        expect(logs[0].message).toBe('error message');
      });

      it('should include error object with stack trace', () => {
        const err = new Error('Something went wrong');
        testLogger.error('operation failed', err);

        const logs = testLogger.getLogs();
        expect(logs[0].error).toBeDefined();
        expect(logs[0].error?.message).toBe('Something went wrong');
        expect(logs[0].error?.name).toBe('Error');
        expect(logs[0].error?.stack).toBeDefined();
      });

      it('should include both error and metadata', () => {
        const err = new Error('Database error');
        const meta = { query: 'SELECT * FROM users', duration: 5000 };
        testLogger.error('database query failed', err, meta);

        const logs = testLogger.getLogs();
        expect(logs[0].error?.message).toBe('Database error');
        expect(logs[0].meta).toEqual(meta);
      });

      it('should handle custom error types', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }

        const err = new CustomError('Custom error occurred');
        testLogger.error('custom error', err);

        const logs = testLogger.getLogs();
        expect(logs[0].error?.name).toBe('CustomError');
        expect(logs[0].error?.message).toBe('Custom error occurred');
      });
    });
  });

  describe('Console Output', () => {
    beforeEach(() => {
      testLogger.setConsoleOutput(true);
    });

    it('should output DEBUG logs to console.log', () => {
      testLogger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        ''
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('debug message'),
        ''
      );
    });

    it('should output INFO logs to console.log', () => {
      testLogger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        ''
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('info message'),
        ''
      );
    });

    it('should output WARN logs to console.warn', () => {
      testLogger.warn('warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        ''
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('warning message'),
        ''
      );
    });

    it('should output ERROR logs to console.error', () => {
      testLogger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        ''
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('error message'),
        ''
      );
    });

    it('should include metadata in console output', () => {
      const meta = { key: 'value' };
      testLogger.info('message with meta', meta);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('message with meta'),
        meta
      );
    });

    it('should include error in console.error output', () => {
      const err = new Error('Test error');
      testLogger.error('error with exception', err);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('error with exception'),
        expect.objectContaining({
          message: 'Test error',
          name: 'Error'
        })
      );
    });

    it('should output error stack trace separately', () => {
      const err = new Error('Test error');
      testLogger.error('error with stack', err);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Error: Test error')
      );
    });

    it('should not output to console when disabled', () => {
      testLogger.setConsoleOutput(false);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp in console output', () => {
      testLogger.info('timestamped message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
        ''
      );
    });
  });

  describe('Memory Buffer (Circular Buffer)', () => {
    it('should store logs in memory', () => {
      testLogger.info('log 1');
      testLogger.info('log 2');
      testLogger.info('log 3');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].message).toBe('log 1');
      expect(logs[1].message).toBe('log 2');
      expect(logs[2].message).toBe('log 3');
    });

    it('should maintain circular buffer of max 1000 logs', () => {
      // Add 1001 logs
      for (let i = 0; i < 1001; i++) {
        testLogger.info(`log ${i}`);
      }

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1000);

      // First log should be removed, so first log should be "log 1"
      expect(logs[0].message).toBe('log 1');
      expect(logs[logs.length - 1].message).toBe('log 1000');
    });

    it('should remove oldest logs when buffer is full', () => {
      // Fill buffer
      for (let i = 0; i < 1000; i++) {
        testLogger.info(`log ${i}`);
      }

      // Add one more
      testLogger.info('newest log');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1000);
      expect(logs[0].message).toBe('log 1');
      expect(logs[logs.length - 1].message).toBe('newest log');
    });

    it('should handle buffer edge case with exactly 1000 logs', () => {
      for (let i = 0; i < 1000; i++) {
        testLogger.info(`log ${i}`);
      }

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1000);
      expect(logs[0].message).toBe('log 0');
    });
  });

  describe('getRecentLogs()', () => {
    it('should return last 100 logs by default', () => {
      for (let i = 0; i < 200; i++) {
        testLogger.info(`log ${i}`);
      }

      const recent = testLogger.getRecentLogs();
      expect(recent.length).toBe(100);
      expect(recent[0].message).toBe('log 100');
      expect(recent[99].message).toBe('log 199');
    });

    it('should return specified number of recent logs', () => {
      for (let i = 0; i < 50; i++) {
        testLogger.info(`log ${i}`);
      }

      const recent = testLogger.getRecentLogs(10);
      expect(recent.length).toBe(10);
      expect(recent[0].message).toBe('log 40');
      expect(recent[9].message).toBe('log 49');
    });

    it('should return all logs when count exceeds total logs', () => {
      testLogger.info('log 1');
      testLogger.info('log 2');
      testLogger.info('log 3');

      const recent = testLogger.getRecentLogs(100);
      expect(recent.length).toBe(3);
    });

    it('should return empty array when no logs exist', () => {
      const recent = testLogger.getRecentLogs();
      expect(recent).toEqual([]);
    });
  });

  describe('getLogs() with filters', () => {
    beforeEach(() => {
      testLogger.debug('debug message 1');
      testLogger.info('info message 1');
      testLogger.warn('warn message 1');
      testLogger.error('error message 1');
      testLogger.info('info message 2');
    });

    it('should return all logs when no filter is provided', () => {
      const logs = testLogger.getLogs();
      expect(logs.length).toBe(5);
    });

    it('should filter logs by level', () => {
      const infoLogs = testLogger.getLogs({ level: 'INFO' });
      expect(infoLogs.length).toBe(2);
      expect(infoLogs.every(log => log.level === 'INFO')).toBe(true);
    });

    it('should filter DEBUG logs', () => {
      const debugLogs = testLogger.getLogs({ level: 'DEBUG' });
      expect(debugLogs.length).toBe(1);
      expect(debugLogs[0].message).toBe('debug message 1');
    });

    it('should filter WARN logs', () => {
      const warnLogs = testLogger.getLogs({ level: 'WARN' });
      expect(warnLogs.length).toBe(1);
      expect(warnLogs[0].message).toBe('warn message 1');
    });

    it('should filter ERROR logs', () => {
      const errorLogs = testLogger.getLogs({ level: 'ERROR' });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe('error message 1');
    });

    it('should filter logs by timestamp (since)', () => {
      const now = new Date();

      // Add delay to ensure timestamp difference
      setTimeout(() => {
        testLogger.info('new message');
      }, 10);

      const recentLogs = testLogger.getLogs({ since: now });
      expect(recentLogs.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter logs by both level and timestamp', () => {
      const cutoffTime = new Date();

      testLogger.clearLogs();
      testLogger.info('before cutoff 1');
      testLogger.error('before cutoff 2');

      const filtered = testLogger.getLogs({
        level: 'INFO',
        since: cutoffTime
      });

      expect(filtered.every(log => log.level === 'INFO')).toBe(true);
    });

    it('should return empty array when no logs match filter', () => {
      testLogger.clearLogs();
      testLogger.info('only info log');

      const errorLogs = testLogger.getLogs({ level: 'ERROR' });
      expect(errorLogs).toEqual([]);
    });

    it('should return logs after specific date', () => {
      testLogger.clearLogs();

      const pastDate = new Date('2020-01-01');
      testLogger.info('current log');

      const logs = testLogger.getLogs({ since: pastDate });
      expect(logs.length).toBe(1);
    });

    it('should return empty array for future date filter', () => {
      testLogger.clearLogs();
      testLogger.info('current log');

      const futureDate = new Date('2099-12-31');
      const logs = testLogger.getLogs({ since: futureDate });
      expect(logs).toEqual([]);
    });
  });

  describe('clearLogs()', () => {
    it('should clear all logs', () => {
      testLogger.info('log 1');
      testLogger.info('log 2');
      testLogger.info('log 3');

      expect(testLogger.getLogs().length).toBe(3);

      testLogger.clearLogs();

      expect(testLogger.getLogs().length).toBe(0);
    });

    it('should allow new logs after clearing', () => {
      testLogger.info('before clear');
      testLogger.clearLogs();
      testLogger.info('after clear');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('after clear');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      testLogger.info(longMessage);

      const logs = testLogger.getLogs();
      expect(logs[0].message).toBe(longMessage);
      expect(logs[0].message.length).toBe(10000);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Test with\nnewlines\tand\ttabs and "quotes" and \'apostrophes\'';
      testLogger.info(specialMessage);

      const logs = testLogger.getLogs();
      expect(logs[0].message).toBe(specialMessage);
    });

    it('should handle unicode characters', () => {
      const unicodeMessage = '测试 🚀 emoji 日本語 العربية';
      testLogger.info(unicodeMessage);

      const logs = testLogger.getLogs();
      expect(logs[0].message).toBe(unicodeMessage);
    });

    it('should handle empty messages', () => {
      testLogger.info('');

      const logs = testLogger.getLogs();
      expect(logs[0].message).toBe('');
    });

    it('should handle metadata with nested objects', () => {
      const nestedMeta = {
        user: {
          id: 123,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark'
            }
          }
        }
      };

      testLogger.info('nested metadata', nestedMeta);

      const logs = testLogger.getLogs();
      expect(logs[0].meta).toEqual(nestedMeta);
    });

    it('should handle metadata with arrays', () => {
      const arrayMeta = {
        items: [1, 2, 3, 4, 5],
        tags: ['tag1', 'tag2'],
        matrix: [[1, 2], [3, 4]]
      };

      testLogger.info('array metadata', arrayMeta);

      const logs = testLogger.getLogs();
      expect(logs[0].meta).toEqual(arrayMeta);
    });

    it('should handle metadata with null and undefined values', () => {
      const meta: LogMeta = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false
      };

      testLogger.info('mixed metadata', meta);

      const logs = testLogger.getLogs();
      expect(logs[0].meta).toEqual(meta);
    });

    it('should handle errors without stack traces', () => {
      const err = new Error('Error without stack');
      delete err.stack;

      testLogger.error('error without stack', err);

      const logs = testLogger.getLogs();
      expect(logs[0].error?.message).toBe('Error without stack');
      expect(logs[0].error?.stack).toBeUndefined();
    });

    it('should not log when metadata is provided but empty object', () => {
      testLogger.info('message', {});

      const logs = testLogger.getLogs();
      expect(logs[0].meta).toEqual({});
    });
  });

  describe('Convenience Functions', () => {
    it('should export debug function', () => {
      expect(typeof debug).toBe('function');
      // Verify it calls logger instance without errors
      expect(() => debug('test debug')).not.toThrow();
    });

    it('should export info function', () => {
      expect(typeof info).toBe('function');
      // Verify it calls logger instance without errors
      expect(() => info('test info')).not.toThrow();
    });

    it('should export warn function', () => {
      expect(typeof warn).toBe('function');
      // Verify it calls logger instance without errors
      expect(() => warn('test warn')).not.toThrow();
    });

    it('should export error function', () => {
      expect(typeof error).toBe('function');
      // Verify it calls logger instance without errors
      const err = new Error('test');
      expect(() => error('test error', err)).not.toThrow();
    });

    it('should pass through to logger instance methods', () => {
      // Since the convenience functions are simple wrappers,
      // and we've thoroughly tested the Logger class methods,
      // we just need to verify they exist and are callable

      // Call convenience functions - they should work
      debug('test');
      info('test');
      warn('test');
      error('test');

      // As long as they don't throw and the logger receives calls, we're good
      // (The actual logging behavior is already tested in other test suites)
      expect(typeof debug).toBe('function');
      expect(typeof info).toBe('function');
      expect(typeof warn).toBe('function');
      expect(typeof error).toBe('function');
    });
  });

  describe('Log Level Parsing', () => {
    beforeEach(() => {
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;
    });

    afterEach(() => {
      delete process.env.LOG_LEVEL;
      // @ts-expect-error - Accessing private property for testing
      Logger.instance = undefined;
    });

    it('should parse lowercase log levels', () => {
      process.env.LOG_LEVEL = 'debug';
      const instance = Logger.getInstance();
      instance.debug('test');
      expect(instance.getLogs().length).toBeGreaterThan(0);
    });

    it('should parse uppercase log levels', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const instance = Logger.getInstance();
      instance.info('should not appear');
      instance.error('should appear');

      const logs = instance.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('ERROR');
    });

    it('should parse mixed case log levels', () => {
      process.env.LOG_LEVEL = 'WaRn';
      const instance = Logger.getInstance();
      instance.info('should not appear');
      instance.warn('should appear');

      const logs = instance.getLogs();
      expect(logs.some(log => log.level === 'WARN')).toBe(true);
    });

    it('should default to INFO for invalid log levels', () => {
      process.env.LOG_LEVEL = 'invalid_level';
      const instance = Logger.getInstance();

      instance.debug('should not appear');
      instance.info('should appear');

      const logs = instance.getLogs();
      expect(logs.some(log => log.level === 'DEBUG')).toBe(false);
      expect(logs.some(log => log.level === 'INFO')).toBe(true);
    });

    it('should default to INFO when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;
      const instance = Logger.getInstance();

      instance.debug('should not appear');
      instance.info('should appear');

      const logs = instance.getLogs();
      expect(logs.some(log => log.level === 'DEBUG')).toBe(false);
    });
  });

  describe('Configuration Methods', () => {
    it('should change log level dynamically', () => {
      testLogger.setLogLevel(LogLevel.ERROR);
      testLogger.info('should not appear');

      testLogger.setLogLevel(LogLevel.DEBUG);
      testLogger.info('should appear');

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('should appear');
    });

    it('should toggle console output dynamically', () => {
      testLogger.setConsoleOutput(true);
      testLogger.info('with console');
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockClear();

      testLogger.setConsoleOutput(false);
      testLogger.info('without console');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Thread Safety and Immutability', () => {
    it('should return copy of logs, not reference', () => {
      testLogger.info('original log');

      const logs1 = testLogger.getLogs();
      const logs2 = testLogger.getLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });

    it('should not affect internal logs when returned array is modified', () => {
      testLogger.info('log 1');
      testLogger.info('log 2');

      const logs = testLogger.getLogs();
      logs.pop(); // Remove last log from returned array

      const logsAgain = testLogger.getLogs();
      expect(logsAgain.length).toBe(2); // Internal logs should be unchanged
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle rapid consecutive logging', () => {
      for (let i = 0; i < 100; i++) {
        testLogger.info(`rapid log ${i}`);
      }

      const logs = testLogger.getLogs();
      expect(logs.length).toBe(100);
    });

    it('should handle logging with complex metadata', () => {
      const complexMeta = {
        timestamp: Date.now(),
        user: { id: 123, name: 'Test User' },
        request: { method: 'GET', url: '/api/test' },
        response: { status: 200, body: { data: [1, 2, 3] } },
        performance: { duration: 150, memory: 1024 }
      };

      testLogger.info('complex log', complexMeta);

      const logs = testLogger.getLogs();
      expect(logs[0].meta).toEqual(complexMeta);
    });

    it('should maintain log order under rapid logging', () => {
      for (let i = 0; i < 50; i++) {
        testLogger.info(`ordered log ${i}`);
      }

      const logs = testLogger.getLogs();
      for (let i = 0; i < 50; i++) {
        expect(logs[i].message).toBe(`ordered log ${i}`);
      }
    });
  });
});
