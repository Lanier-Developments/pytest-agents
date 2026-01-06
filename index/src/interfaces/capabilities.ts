/**
 * Index Agent capability interfaces
 */

import { CodeIndex, Symbol, SearchQuery, SearchResult, Reference } from '../types';

export interface ICodeIndexer {
  indexRepository(rootPath: string): Promise<CodeIndex>;
  indexFile(filePath: string): Promise<Symbol[]>;
  updateIndex(index: CodeIndex, changedFiles: string[]): Promise<CodeIndex>;
}

export interface ISymbolMapper {
  addSymbol(symbol: Symbol): void;
  getSymbol(id: string): Symbol | undefined;
  getReferences(symbolId: string): Reference[];
  getStats(): { total: number; byType: Record<string, number>; byFile: Record<string, number> };
  clear(): void;
}

export interface ISearchBuilder {
  search(symbols: Symbol[], query: SearchQuery): SearchResult[];
  buildIndex(symbols: Symbol[]): void;
}

export interface IIndexStorage {
  save(index: CodeIndex): Promise<void>;
  load(): Promise<CodeIndex | null>;
  exists(): Promise<boolean>;
  clear(): Promise<void>;
}
