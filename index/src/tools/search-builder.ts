/**
 * Search query building and execution
 */

import { injectable } from 'tsyringe';
import { Symbol, SearchQuery, SearchResult } from '../types';

@injectable()
export class SearchBuilder {
  search(symbols: Symbol[], query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];

    for (const symbol of symbols) {
      const score = this.calculateRelevance(symbol, query);
      if (score > 0) {
        results.push({
          symbol,
          score,
          matches: this.findMatches(symbol, query),
        });
      }
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  private calculateRelevance(symbol: Symbol, query: SearchQuery): number {
    let score = 0;

    // Exact name match
    if (symbol.name === query.term) {
      score += 100;
    }
    // Case-insensitive match
    else if (symbol.name.toLowerCase() === query.term.toLowerCase()) {
      score += 80;
    }
    // Contains match
    else if (symbol.name.toLowerCase().includes(query.term.toLowerCase())) {
      score += 50;
    }
    // Fuzzy match (if enabled)
    else if (query.fuzzy && this.fuzzyMatch(symbol.name, query.term)) {
      score += 30;
    }

    // Type filter
    if (query.type && symbol.type === query.type) {
      score += 20;
    }

    // File path filter
    if (query.filePath && symbol.filePath.includes(query.filePath)) {
      score += 10;
    }

    // Signature match (if symbol has documentation)
    if (symbol.signature && symbol.signature.toLowerCase().includes(query.term.toLowerCase())) {
      score += 15;
    }

    return score;
  }

  private findMatches(symbol: Symbol, query: SearchQuery): Array<{
    field: string;
    value: string;
    indices: number[][];
  }> {
    const matches: Array<{ field: string; value: string; indices: number[][] }> = [];
    const term = query.term.toLowerCase();

    // Check name
    const nameIndex = symbol.name.toLowerCase().indexOf(term);
    if (nameIndex !== -1) {
      matches.push({
        field: 'name',
        value: symbol.name,
        indices: [[nameIndex, nameIndex + term.length]],
      });
    }

    // Check signature
    if (symbol.signature) {
      const sigIndex = symbol.signature.toLowerCase().indexOf(term);
      if (sigIndex !== -1) {
        matches.push({
          field: 'signature',
          value: symbol.signature,
          indices: [[sigIndex, sigIndex + term.length]],
        });
      }
    }

    return matches;
  }

  private fuzzyMatch(str: string, pattern: string): boolean {
    const strLower = str.toLowerCase();
    const patternLower = pattern.toLowerCase();

    let patternIdx = 0;
    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        patternIdx++;
      }
    }

    return patternIdx === patternLower.length;
  }

  filterByType(symbols: Symbol[], type: Symbol['type']): Symbol[] {
    return symbols.filter((s) => s.type === type);
  }

  filterByFile(symbols: Symbol[], filePath: string): Symbol[] {
    return symbols.filter((s) => s.filePath.includes(filePath));
  }

  groupByFile(symbols: Symbol[]): Map<string, Symbol[]> {
    const grouped = new Map<string, Symbol[]>();

    for (const symbol of symbols) {
      if (!grouped.has(symbol.filePath)) {
        grouped.set(symbol.filePath, []);
      }
      grouped.get(symbol.filePath)!.push(symbol);
    }

    return grouped;
  }
}
