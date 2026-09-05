/**
 * Tests for DI container setup
 */

import 'reflect-metadata';

import { container } from 'tsyringe';
import { setupContainer, resetContainer, TOKENS } from '../src/di/container';
import { IndexStorage } from '../src/memory/index-storage';
import { CodeIndexer } from '../src/capabilities/code-indexer';
import { SymbolMapper } from '../src/capabilities/symbol-mapper';
import { SearchBuilder } from '../src/tools/search-builder';
import { ASTParser } from '../src/tools/ast-parser';

describe('DI container', () => {
  afterEach(() => {
    resetContainer();
  });

  it('registers infrastructure, tools, and capability implementations', () => {
    setupContainer('/tmp/project-a');

    expect(container.resolve(TOKENS.IFileReader)).toBeDefined();
    expect(container.resolve(TOKENS.IFileWriter)).toBeDefined();
    expect(container.resolve(TOKENS.ILogger)).toBeDefined();
    expect(container.resolve(TOKENS.IPathResolver)).toBeDefined();
    expect(container.resolve(TOKENS.IMetrics)).toBeDefined();
    expect(container.resolve(TOKENS.ProjectPath)).toBe('/tmp/project-a');
    expect(container.resolve(TOKENS.IASTParser)).toBeInstanceOf(ASTParser);
    expect(container.resolve(TOKENS.ICodeIndexer)).toBeInstanceOf(CodeIndexer);
    expect(container.resolve(TOKENS.ISymbolMapper)).toBeInstanceOf(SymbolMapper);
    expect(container.resolve(TOKENS.ISearchBuilder)).toBeInstanceOf(SearchBuilder);
    expect(container.resolve(TOKENS.IIndexStorage)).toBeInstanceOf(IndexStorage);
  });

  it('defaults the project path to the current working directory', () => {
    setupContainer();

    expect(container.resolve(TOKENS.ProjectPath)).toBe(process.cwd());
  });

  it('creates a fresh IndexStorage singleton on first setup after a reset', () => {
    resetContainer();
    setupContainer('/tmp/project-b');

    const storage = container.resolve(TOKENS.IIndexStorage);
    expect(storage).toBeInstanceOf(IndexStorage);
  });

  it('reuses the same IndexStorage instance across setupContainer calls without a reset', () => {
    setupContainer('/tmp/project-c');
    const first = container.resolve(TOKENS.IIndexStorage);

    // Calling setupContainer again without resetContainer() in between should
    // hit the cached branch and reuse the existing IndexStorage instance
    // rather than constructing a new one.
    setupContainer('/tmp/project-c');
    const second = container.resolve(TOKENS.IIndexStorage);

    expect(second).toBe(first);
  });

  it('constructs a new IndexStorage instance after resetContainer clears the cache', () => {
    setupContainer('/tmp/project-d');
    const first = container.resolve(TOKENS.IIndexStorage);

    resetContainer();
    setupContainer('/tmp/project-e');
    const second = container.resolve(TOKENS.IIndexStorage);

    expect(second).not.toBe(first);
  });
});
