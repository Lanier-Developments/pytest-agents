/**
 * File system writer implementation
 */

import * as fs from 'fs';
import { injectable } from 'tsyringe';
import { IFileWriter } from '../interfaces/core';

@injectable()
export class FsFileWriter implements IFileWriter {
  writeFileSync(path: string, content: string, encoding: string = 'utf-8'): void {
    fs.writeFileSync(path, content, { encoding: encoding as BufferEncoding });
  }

  unlinkSync(path: string): void {
    fs.unlinkSync(path);
  }
}
