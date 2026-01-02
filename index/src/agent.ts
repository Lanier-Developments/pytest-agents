/**
 * Index Agent - Main agent implementation
 */

import { CodeIndexer } from './capabilities/code-indexer';
import { SymbolMapper } from './capabilities/symbol-mapper';
import { SearchBuilder } from './tools/search-builder';
import { IndexStorage } from './memory/index-storage';
import { CodeIndex, SearchQuery } from './types';
import { logger } from './utils/logger';

export interface AgentRequest {
  action: string;
  params?: Record<string, any>;
}

export interface AgentResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

export class IndexAgent {
  private indexer: CodeIndexer;
  private mapper: SymbolMapper;
  private searchBuilder: SearchBuilder;
  private storage: IndexStorage;
  private currentIndex: CodeIndex | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.indexer = new CodeIndexer();
    this.mapper = new SymbolMapper();
    this.searchBuilder = new SearchBuilder();
    this.storage = new IndexStorage(projectPath);
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      logger.info(`Processing request: ${request.action}`);

      switch (request.action) {
        case 'ping':
          return this.handlePing();

        case 'index_repository':
          return await this.handleIndexRepository(request.params);

        case 'search':
          return this.handleSearch(request.params);

        case 'get_symbol':
          return this.handleGetSymbol(request.params);

        case 'find_references':
          return this.handleFindReferences(request.params);

        case 'get_stats':
          return this.handleGetStats();

        case 'save_index':
          return await this.handleSaveIndex();

        case 'load_index':
          return await this.handleLoadIndex();

        default:
          return {
            status: 'error',
            error: `Unknown action: ${request.action}`,
          };
      }
    } catch (error) {
      logger.error(`Error processing request: ${error}`);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private handlePing(): AgentResponse {
    return {
      status: 'success',
      data: {
        agent: 'index',
        version: '1.0.0',
        capabilities: [
          'index_repository',
          'search',
          'get_symbol',
          'find_references',
          'get_stats',
          'save_index',
          'load_index',
        ],
      },
    };
  }

  private async handleIndexRepository(params?: Record<string, any>): Promise<AgentResponse> {
    const rootPath = params?.rootPath || process.cwd();
    logger.info(`Indexing repository: ${rootPath}`);

    const index = await this.indexer.indexRepository(rootPath);
    this.currentIndex = index;

    // Populate symbol mapper
    this.mapper.clear();
    for (const symbol of index.symbols.values()) {
      this.mapper.addSymbol(symbol);
    }

    return {
      status: 'success',
      data: {
        symbolCount: index.symbols.size,
        fileCount: index.files.size,
        lastUpdated: index.lastUpdated.toISOString(),
      },
    };
  }

  private handleSearch(params?: Record<string, any>): AgentResponse {
    if (!this.currentIndex) {
      return { status: 'error', error: 'No index loaded. Run index_repository first.' };
    }

    const query: SearchQuery = {
      term: params?.term || '',
      type: params?.type,
      filePath: params?.filePath,
      fuzzy: params?.fuzzy || false,
    };

    if (!query.term) {
      return { status: 'error', error: 'Search term is required' };
    }

    const symbols = Array.from(this.currentIndex.symbols.values());
    const results = this.searchBuilder.search(symbols, query);

    return {
      status: 'success',
      data: {
        query,
        results: results.slice(0, params?.limit || 50).map((r) => ({
          symbol: {
            id: r.symbol.id,
            name: r.symbol.name,
            type: r.symbol.type,
            filePath: r.symbol.filePath,
            line: r.symbol.line,
            signature: r.symbol.signature,
          },
          score: r.score,
          matches: r.matches,
        })),
        totalResults: results.length,
      },
    };
  }

  private handleGetSymbol(params?: Record<string, any>): AgentResponse {
    if (!this.currentIndex) {
      return { status: 'error', error: 'No index loaded. Run index_repository first.' };
    }

    const symbolId = params?.symbolId;
    if (!symbolId) {
      return { status: 'error', error: 'symbolId is required' };
    }

    const symbol = this.mapper.getSymbol(symbolId);
    if (!symbol) {
      return { status: 'error', error: `Symbol not found: ${symbolId}` };
    }

    return {
      status: 'success',
      data: { symbol },
    };
  }

  private handleFindReferences(params?: Record<string, any>): AgentResponse {
    if (!this.currentIndex) {
      return { status: 'error', error: 'No index loaded. Run index_repository first.' };
    }

    const symbolId = params?.symbolId;
    if (!symbolId) {
      return { status: 'error', error: 'symbolId is required' };
    }

    const references = this.mapper.getReferences(symbolId);

    return {
      status: 'success',
      data: {
        symbolId,
        references,
        count: references.length,
      },
    };
  }

  private handleGetStats(): AgentResponse {
    if (!this.currentIndex) {
      return { status: 'error', error: 'No index loaded. Run index_repository first.' };
    }

    const stats = this.mapper.getStats();

    return {
      status: 'success',
      data: {
        total: stats.total,
        byType: stats.byType,
        fileCount: this.currentIndex.files.size,
        dependencyNodes: this.currentIndex.dependencies.nodes.size,
        dependencyEdges: this.currentIndex.dependencies.edges.length,
        lastUpdated: this.currentIndex.lastUpdated.toISOString(),
      },
    };
  }

  private async handleSaveIndex(): Promise<AgentResponse> {
    if (!this.currentIndex) {
      return { status: 'error', error: 'No index loaded. Run index_repository first.' };
    }

    await this.storage.save(this.currentIndex);

    return {
      status: 'success',
      data: { message: 'Index saved successfully' },
    };
  }

  private async handleLoadIndex(): Promise<AgentResponse> {
    const index = await this.storage.load();

    if (!index) {
      return { status: 'error', error: 'No saved index found' };
    }

    this.currentIndex = index;

    // Populate symbol mapper
    this.mapper.clear();
    for (const symbol of index.symbols.values()) {
      this.mapper.addSymbol(symbol);
    }

    return {
      status: 'success',
      data: {
        symbolCount: index.symbols.size,
        fileCount: index.files.size,
        lastUpdated: index.lastUpdated.toISOString(),
      },
    };
  }
}
