/**
 * Tests for ResearchCache
 */

import { ResearchCache } from '../src/memory/research-cache';
import { ResearchResult } from '../src/types';

function makeResult(query: string, timestamp: Date): ResearchResult {
  return {
    query,
    sources: [],
    citations: [],
    summary: `summary for ${query}`,
    confidence: 0.9,
    timestamp,
  };
}

describe('ResearchCache', () => {
  let cache: ResearchCache;

  beforeEach(() => {
    cache = new ResearchCache();
  });

  describe('set/get/has', () => {
    it('stores and retrieves a result', () => {
      const result = makeResult('What is TypeScript?', new Date('2024-01-01'));
      cache.set('What is TypeScript?', result);

      expect(cache.has('What is TypeScript?')).toBe(true);
      expect(cache.get('What is TypeScript?')).toEqual(result);
    });

    it('normalizes queries by trimming and lowercasing', () => {
      const result = makeResult('Query One', new Date('2024-01-01'));
      cache.set('  Query One  ', result);

      expect(cache.has('query one')).toBe(true);
      expect(cache.get('QUERY ONE')).toEqual(result);
    });

    it('returns undefined for a missing query', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('returns false from has() for a missing query', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('eviction', () => {
    it('evicts the oldest entry once maxSize is reached', () => {
      const small = new ResearchCache(2);
      small.set('first', makeResult('first', new Date('2024-01-01')));
      small.set('second', makeResult('second', new Date('2024-01-02')));
      expect(small.size()).toBe(2);

      small.set('third', makeResult('third', new Date('2024-01-03')));

      expect(small.size()).toBe(2);
      expect(small.has('first')).toBe(false);
      expect(small.has('second')).toBe(true);
      expect(small.has('third')).toBe(true);
    });

    it('does not evict while under capacity', () => {
      const roomy = new ResearchCache(5);
      roomy.set('a', makeResult('a', new Date()));
      roomy.set('b', makeResult('b', new Date()));
      expect(roomy.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', makeResult('a', new Date()));
      cache.set('b', makeResult('b', new Date()));
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has('a')).toBe(false);
    });
  });

  describe('size', () => {
    it('reports the number of cached entries', () => {
      expect(cache.size()).toBe(0);
      cache.set('a', makeResult('a', new Date()));
      expect(cache.size()).toBe(1);
    });
  });

  describe('getRecentQueries', () => {
    it('returns an empty array when the cache is empty', () => {
      expect(cache.getRecentQueries()).toEqual([]);
    });

    it('returns queries ordered by most recent timestamp first', () => {
      cache.set('oldest', makeResult('oldest', new Date('2024-01-01')));
      cache.set('middle', makeResult('middle', new Date('2024-02-01')));
      cache.set('newest', makeResult('newest', new Date('2024-03-01')));

      const recent = cache.getRecentQueries();
      expect(recent).toEqual(['newest', 'middle', 'oldest']);
    });

    it('limits results to the requested count', () => {
      cache.set('oldest', makeResult('oldest', new Date('2024-01-01')));
      cache.set('middle', makeResult('middle', new Date('2024-02-01')));
      cache.set('newest', makeResult('newest', new Date('2024-03-01')));

      const recent = cache.getRecentQueries(2);
      expect(recent).toEqual(['newest', 'middle']);
    });

    it('defaults to returning up to 10 queries', () => {
      for (let i = 0; i < 12; i++) {
        cache.set(`query-${i}`, makeResult(`query-${i}`, new Date(2024, 0, i + 1)));
      }
      expect(cache.getRecentQueries()).toHaveLength(10);
    });
  });
});
