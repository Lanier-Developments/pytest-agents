/**
 * Symbol mapping capability
 */

import { injectable, inject } from 'tsyringe';
import { Symbol, Reference } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class SymbolMapper {
  private symbols: Map<string, Symbol>;

  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {
    this.symbols = new Map();
  }

  addSymbol(symbol: Symbol): void {
    this.symbols.set(symbol.id, symbol);
    this.logger.debug(`Added symbol: ${symbol.name}`);
  }

  getSymbol(id: string): Symbol | undefined {
    return this.symbols.get(id);
  }

  findByName(name: string): Symbol[] {
    return Array.from(this.symbols.values()).filter((s) => s.name === name);
  }

  findByType(type: Symbol['type']): Symbol[] {
    return Array.from(this.symbols.values()).filter((s) => s.type === type);
  }

  findByFile(filePath: string): Symbol[] {
    return Array.from(this.symbols.values()).filter((s) => s.filePath === filePath);
  }

  addReference(symbolId: string, reference: Reference): boolean {
    const symbol = this.symbols.get(symbolId);
    if (!symbol) {
      this.logger.warn(`Symbol not found: ${symbolId}`);
      return false;
    }

    symbol.references.push(reference);
    this.logger.debug(`Added reference to symbol: ${symbol.name}`);
    return true;
  }

  getReferences(symbolId: string): Reference[] {
    const symbol = this.symbols.get(symbolId);
    return symbol ? symbol.references : [];
  }

  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  clear(): void {
    this.symbols.clear();
    this.logger.info('Cleared symbol map');
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    byFile: Record<string, number>;
  } {
    const stats = {
      total: this.symbols.size,
      byType: {} as Record<string, number>,
      byFile: {} as Record<string, number>,
    };

    for (const symbol of this.symbols.values()) {
      // Count by type
      stats.byType[symbol.type] = (stats.byType[symbol.type] || 0) + 1;

      // Count by file
      stats.byFile[symbol.filePath] = (stats.byFile[symbol.filePath] || 0) + 1;
    }

    return stats;
  }
}
