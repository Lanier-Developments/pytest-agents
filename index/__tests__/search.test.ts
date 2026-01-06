/**
 * Search functionality tests
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { SearchBuilder } from '../src/tools/search-builder';
import { Symbol } from '../src/types';

describe('SearchBuilder', () => {
  let searchBuilder: SearchBuilder;
  let symbols: Symbol[];

  beforeEach(() => {
    resetContainer();
    setupContainer();
    searchBuilder = container.resolve(SearchBuilder);

    symbols = [
      {
        id: 'test.ts:1:0:getUserById',
        name: 'getUserById',
        type: 'function',
        filePath: '/path/to/test.ts',
        line: 1,
        column: 0,
        scope: 'module',
        signature: 'function getUserById(id: string): User',
        references: [],
      },
      {
        id: 'test.ts:5:0:User',
        name: 'User',
        type: 'class',
        filePath: '/path/to/test.ts',
        line: 5,
        column: 0,
        scope: 'module',
        signature: 'class User',
        references: [],
      },
      {
        id: 'test.ts:10:0:getUser',
        name: 'getUser',
        type: 'function',
        filePath: '/path/to/test.ts',
        line: 10,
        column: 0,
        scope: 'module',
        signature: 'function getUser(): User',
        references: [],
      },
      {
        id: 'other.ts:1:0:createUser',
        name: 'createUser',
        type: 'function',
        filePath: '/path/to/other.ts',
        line: 1,
        column: 0,
        scope: 'module',
        references: [],
      },
    ];
  });

  describe('search', () => {
    it('should find exact match', () => {
      const results = searchBuilder.search(symbols, { term: 'User' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol.name).toBe('User');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should find case-insensitive match', () => {
      const results = searchBuilder.search(symbols, { term: 'user' });

      expect(results.length).toBeGreaterThan(0);
      const hasUser = results.some((r) => r.symbol.name === 'User');
      expect(hasUser).toBe(true);
    });

    it('should find partial match', () => {
      const results = searchBuilder.search(symbols, { term: 'get' });

      expect(results.length).toBeGreaterThan(0);
      const hasGetUser = results.some((r) => r.symbol.name === 'getUser');
      const hasGetUserById = results.some((r) => r.symbol.name === 'getUserById');
      expect(hasGetUser).toBe(true);
      expect(hasGetUserById).toBe(true);
    });

    it('should support fuzzy matching', () => {
      const results = searchBuilder.search(symbols, { term: 'usrbyid', fuzzy: true });

      const hasGetUserById = results.some((r) => r.symbol.name === 'getUserById');
      expect(hasGetUserById).toBe(true);
    });

    it('should boost score for matching type', () => {
      const results = searchBuilder.search(symbols, {
        term: 'User',
        type: 'class',
      });

      expect(results.length).toBeGreaterThan(0);
      // Class symbols should score higher than function symbols
      const classResult = results.find((r) => r.symbol.type === 'class');
      const functionResult = results.find((r) => r.symbol.type === 'function');

      if (classResult && functionResult) {
        expect(classResult.score).toBeGreaterThan(functionResult.score);
      }
    });

    it('should boost score for matching file path', () => {
      const results = searchBuilder.search(symbols, {
        term: 'User',
        filePath: 'test.ts',
      });

      expect(results.length).toBeGreaterThan(0);
      // Symbols in test.ts should score higher than symbols in other.ts
      const testResult = results.find((r) => r.symbol.filePath.includes('test.ts'));
      const otherResult = results.find((r) => r.symbol.filePath.includes('other.ts'));

      if (testResult && otherResult) {
        expect(testResult.score).toBeGreaterThan(otherResult.score);
      }
    });

    it('should return empty array for no matches', () => {
      const results = searchBuilder.search(symbols, { term: 'NonExistent' });

      expect(results).toEqual([]);
    });

    it('should sort results by relevance score', () => {
      const results = searchBuilder.search(symbols, { term: 'User' });

      // Exact match should be first
      expect(results[0].symbol.name).toBe('User');

      // Check that scores are in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should include match information', () => {
      const results = searchBuilder.search(symbols, { term: 'User' });

      expect(results[0].matches).toBeDefined();
      expect(Array.isArray(results[0].matches)).toBe(true);
    });
  });

  describe('filterByType', () => {
    it('should filter symbols by type', () => {
      const functions = searchBuilder.filterByType(symbols, 'function');

      expect(functions.length).toBe(3);
      expect(functions.every((s) => s.type === 'function')).toBe(true);
    });

    it('should return empty array if no matches', () => {
      const interfaces = searchBuilder.filterByType(symbols, 'interface');

      expect(interfaces).toEqual([]);
    });
  });

  describe('filterByFile', () => {
    it('should filter symbols by file path', () => {
      const testSymbols = searchBuilder.filterByFile(symbols, 'test.ts');

      expect(testSymbols.length).toBe(3);
      expect(testSymbols.every((s) => s.filePath.includes('test.ts'))).toBe(true);
    });

    it('should return empty array if no matches', () => {
      const noMatch = searchBuilder.filterByFile(symbols, 'nonexistent.ts');

      expect(noMatch).toEqual([]);
    });
  });

  describe('groupByFile', () => {
    it('should group symbols by file path', () => {
      const grouped = searchBuilder.groupByFile(symbols);

      expect(grouped.size).toBe(2);
      expect(grouped.get('/path/to/test.ts')?.length).toBe(3);
      expect(grouped.get('/path/to/other.ts')?.length).toBe(1);
    });

    it('should return empty map for empty input', () => {
      const grouped = searchBuilder.groupByFile([]);

      expect(grouped.size).toBe(0);
    });
  });
});
