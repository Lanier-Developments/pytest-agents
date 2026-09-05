/**
 * Tests for ConsoleLogger
 */

import 'reflect-metadata';

import { ConsoleLogger } from '../src/infrastructure/console-logger';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger();
  });

  it('logs debug messages with meta', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('debug message', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('debug message', { key: 'value' });
    spy.mockRestore();
  });

  it('logs debug messages without meta', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('debug message');
    expect(spy).toHaveBeenCalledWith('debug message', '');
    spy.mockRestore();
  });

  it('logs info messages with meta', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('info message', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('info message', { key: 'value' });
    spy.mockRestore();
  });

  it('logs info messages without meta', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('info message');
    expect(spy).toHaveBeenCalledWith('info message', '');
    spy.mockRestore();
  });

  it('logs warn messages with meta', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warn message', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('warn message', { key: 'value' });
    spy.mockRestore();
  });

  it('logs warn messages without meta', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warn message');
    expect(spy).toHaveBeenCalledWith('warn message', '');
    spy.mockRestore();
  });

  it('logs error messages with meta', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('error message', { key: 'value' });
    expect(spy).toHaveBeenCalledWith('error message', { key: 'value' });
    spy.mockRestore();
  });

  it('logs error messages without meta', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('error message');
    expect(spy).toHaveBeenCalledWith('error message', '');
    spy.mockRestore();
  });
});
