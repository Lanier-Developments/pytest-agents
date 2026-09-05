/**
 * Tests for FsFileReader
 */

import 'reflect-metadata';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FsFileReader } from '../src/infrastructure/fs-file-reader';

describe('FsFileReader', () => {
  let reader: FsFileReader;
  let tmpDir: string;

  beforeEach(() => {
    reader = new FsFileReader();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-file-reader-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads file contents with default encoding', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello world');

    expect(reader.readFileSync(filePath)).toBe('hello world');
  });

  it('reads file contents with a specified encoding', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'hello world');

    expect(reader.readFileSync(filePath, 'utf-8')).toBe('hello world');
  });

  it('returns true for existing paths', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'content');

    expect(reader.existsSync(filePath)).toBe(true);
  });

  it('returns false for missing paths', () => {
    expect(reader.existsSync(path.join(tmpDir, 'missing.txt'))).toBe(false);
  });

  it('returns file stats for a file', () => {
    const filePath = path.join(tmpDir, 'file.txt');
    fs.writeFileSync(filePath, 'content');

    const stats = reader.statSync(filePath);
    expect(stats.isFile()).toBe(true);
    expect(stats.isDirectory()).toBe(false);
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.mtime.getTime()).not.toBeNaN();
  });

  it('returns file stats for a directory', () => {
    const stats = reader.statSync(tmpDir);
    expect(stats.isDirectory()).toBe(true);
    expect(stats.isFile()).toBe(false);
  });

  it('lists directory contents', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), '');
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), '');

    const entries = reader.readdirSync(tmpDir);
    expect(entries.sort()).toEqual(['a.txt', 'b.txt']);
  });

  it('throws when reading a missing file', () => {
    expect(() => reader.readFileSync(path.join(tmpDir, 'missing.txt'))).toThrow();
  });
});
