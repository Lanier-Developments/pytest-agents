/**
 * Tests for the logger utility
 */

import { LogLevel, logger } from '../src/utils/logger';

describe('Logger', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logger.setLevel(LogLevel.INFO);
  });

  it('logs debug messages when level is DEBUG', () => {
    logger.debug('debug message', { a: 1 });
    expect(errorSpy).toHaveBeenCalledWith('[DEBUG] debug message', { a: 1 });
  });

  it('logs info messages when level allows it', () => {
    logger.info('info message');
    expect(errorSpy).toHaveBeenCalledWith('[INFO] info message');
  });

  it('logs warn messages when level allows it', () => {
    logger.warn('warn message');
    expect(errorSpy).toHaveBeenCalledWith('[WARN] warn message');
  });

  it('logs error messages when level allows it', () => {
    logger.error('error message');
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('suppresses lower-priority messages once level is raised', () => {
    logger.setLevel(LogLevel.ERROR);
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    expect(errorSpy).not.toHaveBeenCalled();

    logger.error('error message');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('respects LogLevel ordering when set to WARN', () => {
    logger.setLevel(LogLevel.WARN);
    logger.debug('debug message');
    logger.info('info message');
    expect(errorSpy).not.toHaveBeenCalled();

    logger.warn('warn message');
    logger.error('error message');
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
