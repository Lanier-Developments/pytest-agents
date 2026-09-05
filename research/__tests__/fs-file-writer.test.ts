/**
 * Tests for FsFileWriter
 */

import 'reflect-metadata';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsFileWriter } from '../src/infrastructure/fs-file-writer';

describe('FsFileWriter', () => {
  let writer: FsFileWriter;
  let tmpDir: string;

  beforeEach(() => {
    writer = new FsFileWriter();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-file-writer-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes file contents with default encoding', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    writer.writeFileSync(filePath, 'hello world');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world');
  });

  it('writes file contents with a specified encoding', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    writer.writeFileSync(filePath, 'hello world', 'utf-8');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world');
  });

  it('overwrites existing file contents', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    writer.writeFileSync(filePath, 'first');
    writer.writeFileSync(filePath, 'second');

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('second');
  });

  it('removes a file', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    writer.writeFileSync(filePath, 'content');
    expect(fs.existsSync(filePath)).toBe(true);

    writer.unlinkSync(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('throws when removing a missing file', () => {
    expect(() => writer.unlinkSync(path.join(tmpDir, 'missing.txt'))).toThrow();
  });
});
