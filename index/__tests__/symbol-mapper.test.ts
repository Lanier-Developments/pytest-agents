/**
 * Tests for SymbolMapper
 */

import 'reflect-metadata';

import { SymbolMapper } from '../src/capabilities/symbol-mapper';
import { ILogger } from '../src/interfaces/core';
import { Symbol, Reference } from '../src/types';

function makeLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function makeSymbol(overrides: Partial<Symbol> = {}): Symbol {
  return {
    id: 'file.ts:1:0:foo',
    name: 'foo',
    type: 'function',
    filePath: '/src/file.ts',
    line: 1,
    column: 0,
    scope: 'module',
    signature: 'function foo()',
    references: [],
    ...overrides,
  };
}

describe('SymbolMapper', () => {
  let logger: jest.Mocked<ILogger>;
  let mapper: SymbolMapper;

  beforeEach(() => {
    logger = makeLogger();
    mapper = new SymbolMapper(logger);
  });

  it('adds a symbol and logs it', () => {
    const symbol = makeSymbol();
    mapper.addSymbol(symbol);

    expect(mapper.getSymbol(symbol.id)).toBe(symbol);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('foo'));
  });

  it('returns undefined for an unknown symbol id', () => {
    expect(mapper.getSymbol('missing')).toBeUndefined();
  });

  it('finds symbols by name', () => {
    const a = makeSymbol({ id: 'a', name: 'foo' });
    const b = makeSymbol({ id: 'b', name: 'bar' });
    const c = makeSymbol({ id: 'c', name: 'foo' });
    mapper.addSymbol(a);
    mapper.addSymbol(b);
    mapper.addSymbol(c);

    expect(mapper.findByName('foo')).toEqual([a, c]);
    expect(mapper.findByName('nonexistent')).toEqual([]);
  });

  it('finds symbols by type', () => {
    const fn = makeSymbol({ id: 'a', type: 'function' });
    const cls = makeSymbol({ id: 'b', type: 'class' });
    mapper.addSymbol(fn);
    mapper.addSymbol(cls);

    expect(mapper.findByType('function')).toEqual([fn]);
    expect(mapper.findByType('interface')).toEqual([]);
  });

  it('finds symbols by file', () => {
    const a = makeSymbol({ id: 'a', filePath: '/src/a.ts' });
    const b = makeSymbol({ id: 'b', filePath: '/src/b.ts' });
    mapper.addSymbol(a);
    mapper.addSymbol(b);

    expect(mapper.findByFile('/src/a.ts')).toEqual([a]);
    expect(mapper.findByFile('/src/missing.ts')).toEqual([]);
  });

  it('adds a reference to an existing symbol', () => {
    const symbol = makeSymbol({ id: 'a', references: [] });
    mapper.addSymbol(symbol);

    const reference: Reference = {
      filePath: '/src/other.ts',
      line: 10,
      column: 2,
      type: 'usage',
    };

    const result = mapper.addReference('a', reference);

    expect(result).toBe(true);
    expect(symbol.references).toEqual([reference]);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Added reference'));
  });

  it('returns false and warns when adding a reference to a missing symbol', () => {
    const reference: Reference = {
      filePath: '/src/other.ts',
      line: 10,
      column: 2,
      type: 'usage',
    };

    const result = mapper.addReference('missing', reference);

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('missing'));
  });

  it('returns references for an existing symbol', () => {
    const reference: Reference = {
      filePath: '/src/other.ts',
      line: 3,
      column: 1,
      type: 'definition',
    };
    const symbol = makeSymbol({ id: 'a', references: [reference] });
    mapper.addSymbol(symbol);

    expect(mapper.getReferences('a')).toEqual([reference]);
  });

  it('returns an empty array of references for a missing symbol', () => {
    expect(mapper.getReferences('missing')).toEqual([]);
  });

  it('returns all symbols', () => {
    const a = makeSymbol({ id: 'a' });
    const b = makeSymbol({ id: 'b' });
    mapper.addSymbol(a);
    mapper.addSymbol(b);

    expect(mapper.getAllSymbols()).toEqual([a, b]);
  });

  it('clears all symbols and logs it', () => {
    mapper.addSymbol(makeSymbol());
    mapper.clear();

    expect(mapper.getAllSymbols()).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared'));
  });

  it('computes stats grouped by type and file', () => {
    mapper.addSymbol(makeSymbol({ id: 'a', type: 'function', filePath: '/src/a.ts' }));
    mapper.addSymbol(makeSymbol({ id: 'b', type: 'function', filePath: '/src/a.ts' }));
    mapper.addSymbol(makeSymbol({ id: 'c', type: 'class', filePath: '/src/b.ts' }));

    const stats = mapper.getStats();

    expect(stats.total).toBe(3);
    expect(stats.byType).toEqual({ function: 2, class: 1 });
    expect(stats.byFile).toEqual({ '/src/a.ts': 2, '/src/b.ts': 1 });
  });

  it('returns zeroed stats for an empty map', () => {
    const stats = mapper.getStats();

    expect(stats.total).toBe(0);
    expect(stats.byType).toEqual({});
    expect(stats.byFile).toEqual({});
  });
});
