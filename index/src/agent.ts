/**
 * Index Agent - Main agent implementation
 */

import { injectable, inject } from 'tsyringe';
import { ICodeIndexer, ISymbolMapper, ISearchBuilder, IIndexStorage } from './interfaces/capabilities';
import { ILogger, IMetrics } from './interfaces/core';
import { TOKENS } from './di/tokens';
import { CodeIndex, SearchQuery } from './types';

export interface AgentRequest {
  action: string;
  params?: Record<string, any>;
}

export interface AgentResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

@injectable()
export class IndexAgent {
  private currentIndex: CodeIndex | null = null;

  constructor(
    @inject(TOKENS.ICodeIndexer) private indexer: ICodeIndexer,
    @inject(TOKENS.ISymbolMapper) private mapper: ISymbolMapper,
    @inject(TOKENS.ISearchBuilder) private searchBuilder: ISearchBuilder,
    @inject(TOKENS.IIndexStorage) private storage: IIndexStorage,
    @inject(TOKENS.ILogger) private logger: ILogger,
    @inject(TOKENS.IMetrics) private metrics: IMetrics
  ) {}

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    this.logger.info(`Processing request: ${request.action}`);

    // Track total requests
    this.metrics.incrementCounter('index_agent_requests_total', { action: request.action });

    // Start timer for request duration
    const endTimer = this.metrics.startTimer('index_agent_request_duration_seconds', { action: request.action });

    try {
      let response: AgentResponse;

      switch (request.action) {
        case 'ping':
          response = this.handlePing();
          break;

        case 'index_repository':
          response = await this.handleIndexRepository(request.params);
          break;

        case 'search':
          response = this.handleSearch(request.params);
          break;

        case 'get_symbol':
          response = this.handleGetSymbol(request.params);
          break;

        case 'find_references':
          response = this.handleFindReferences(request.params);
          break;

        case 'get_stats':
          response = this.handleGetStats();
          break;

        case 'save_index':
          response = await this.handleSaveIndex();
          break;

        case 'load_index':
          response = await this.handleLoadIndex();
          break;

        case 'get_metrics':
          response = await this.handleGetMetrics();
          break;

        default:
          response = {
            status: 'error',
            error: `Unknown action: ${request.action}`,
          };
      }

      // Track success/error
      if (response.status === 'success') {
        this.metrics.incrementCounter('index_agent_requests_success_total', { action: request.action });
      } else {
        this.metrics.incrementCounter('index_agent_requests_error_total', { action: request.action });
      }

      endTimer();
      return response;
    } catch (error) {
      this.logger.error(`Error processing request: ${error}`);
      this.metrics.incrementCounter('index_agent_requests_error_total', { action: request.action });
      endTimer();
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
    this.logger.info(`Indexing repository: ${rootPath}`);

    const index = await this.indexer.indexRepository(rootPath);
    this.currentIndex = index;

    // Populate symbol mapper
    this.mapper.clear();
    for (const symbol of index.symbols.values()) {
      this.mapper.addSymbol(symbol);
    }

    // Track metrics
    this.metrics.incrementCounter('index_agent_repositories_indexed_total');
    this.metrics.setGauge('index_agent_symbols_total', index.symbols.size);
    this.metrics.setGauge('index_agent_files_indexed_total', index.files.size);

    // Track symbols by type
    const symbolsByType = new Map<string, number>();
    for (const symbol of index.symbols.values()) {
      symbolsByType.set(symbol.type, (symbolsByType.get(symbol.type) || 0) + 1);
    }
    symbolsByType.forEach((count, type) => {
      this.metrics.setGauge('index_agent_symbols_by_type', count, { type });
    });

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

    // Track metrics
    this.metrics.incrementCounter('index_agent_searches_performed_total');

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

    // Track metrics
    this.metrics.incrementCounter('index_agent_references_found_total');

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

  private async handleGetMetrics(): Promise<AgentResponse> {
    const metrics = await this.metrics.getMetrics();

    return {
      status: 'success',
      data: {
        metrics,
        format: 'prometheus',
      },
    };
  }
}
