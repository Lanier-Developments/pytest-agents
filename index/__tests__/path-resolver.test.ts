/**
 * Tests for PathResolver
 */

import 'reflect-metadata';

import * as path from 'path';
import { PathResolver } from '../src/infrastructure/path-resolver';

describe('PathResolver', () => {
  let resolver: PathResolver;

  beforeEach(() => {
    resolver = new PathResolver();
  });

  it('joins path segments', () => {
    expect(resolver.join('a', 'b', 'c.txt')).toBe(path.join('a', 'b', 'c.txt'));
  });

  it('resolves path segments to an absolute path', () => {
    expect(resolver.resolve('a', 'b.txt')).toBe(path.resolve('a', 'b.txt'));
  });

  it('returns the directory name', () => {
    expect(resolver.dirname('/a/b/c.txt')).toBe(path.dirname('/a/b/c.txt'));
  });

  it('returns the base name', () => {
    expect(resolver.basename('/a/b/c.txt')).toBe(path.basename('/a/b/c.txt'));
  });

  it('returns the base name without an extension', () => {
    expect(resolver.basename('/a/b/c.txt', '.txt')).toBe(path.basename('/a/b/c.txt', '.txt'));
  });

  it('returns the extension name', () => {
    expect(resolver.extname('/a/b/c.txt')).toBe('.txt');
  });

  it('returns an empty extension for extensionless paths', () => {
    expect(resolver.extname('/a/b/c')).toBe('');
  });
});
