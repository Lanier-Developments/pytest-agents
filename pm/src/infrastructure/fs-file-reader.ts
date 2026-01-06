/**
 * File system reader implementation
 */

import * as fs from 'fs';
import { injectable } from 'tsyringe';
import { IFileReader, IFileStats } from '../interfaces/core';

@injectable()
export class FsFileReader implements IFileReader {
  readFileSync(path: string, encoding: string = 'utf-8'): string {
    return fs.readFileSync(path, { encoding: encoding as BufferEncoding });
  }

  existsSync(path: string): boolean {
    return fs.existsSync(path);
  }

  statSync(path: string): IFileStats {
    const stat = fs.statSync(path);
    return {
      isDirectory: () => stat.isDirectory(),
      isFile: () => stat.isFile(),
      size: stat.size,
      mtime: stat.mtime,
    };
  }

  readdirSync(path: string): string[] {
    return fs.readdirSync(path);
  }
}
