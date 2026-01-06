/**
 * Console logger implementation
 */

import { injectable } from 'tsyringe';
import { ILogger } from '../interfaces/core';

@injectable()
export class ConsoleLogger implements ILogger {
  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(message, meta || '');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(message, meta || '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(message, meta || '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(message, meta || '');
  }
}
