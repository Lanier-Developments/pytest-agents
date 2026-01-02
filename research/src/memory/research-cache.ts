/**
 * Research result caching
 */

import { ResearchResult } from '../types';

export class ResearchCache {
  private cache: Map<string, ResearchResult>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(query: string, result: ResearchResult): void {
    const key = this.normalizeQuery(query);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  get(query: string): ResearchResult | undefined {
    const key = this.normalizeQuery(query);
    return this.cache.get(key);
  }

  has(query: string): boolean {
    const key = this.normalizeQuery(query);
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  getRecentQueries(count: number = 10): string[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count)
      .map((r) => r.query);
  }
}
