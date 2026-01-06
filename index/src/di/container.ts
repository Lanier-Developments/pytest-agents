/**
 * Dependency Injection container configuration for Index Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from './tokens';

// Infrastructure implementations
import { FsFileReader } from '../infrastructure/fs-file-reader';
import { FsFileWriter } from '../infrastructure/fs-file-writer';
import { ConsoleLogger } from '../infrastructure/console-logger';
import { PathResolver } from '../infrastructure/path-resolver';
import { PrometheusMetrics } from '../infrastructure/prometheus-metrics';

// Capability implementations
import { CodeIndexer } from '../capabilities/code-indexer';
import { SymbolMapper } from '../capabilities/symbol-mapper';
import { SearchBuilder } from '../tools/search-builder';
import { ASTParser } from '../tools/ast-parser';
import { IndexStorage } from '../memory/index-storage';

// Re-export TOKENS for convenience
export { TOKENS };

/**
 * Setup and configure the DI container
 */
export function setupContainer(): void {
  // Register infrastructure implementations as singletons
  container.registerSingleton(TOKENS.IFileReader, FsFileReader);
  container.registerSingleton(TOKENS.IFileWriter, FsFileWriter);
  container.registerSingleton(TOKENS.ILogger, ConsoleLogger);
  container.registerSingleton(TOKENS.IPathResolver, PathResolver);
  container.registerSingleton(TOKENS.IMetrics, PrometheusMetrics);

  // Register tools
  container.register(TOKENS.IASTParser, { useClass: ASTParser });

  // Register capability implementations
  container.register(TOKENS.ICodeIndexer, { useClass: CodeIndexer });
  container.register(TOKENS.ISymbolMapper, { useClass: SymbolMapper });
  container.register(TOKENS.ISearchBuilder, { useClass: SearchBuilder });

  // Use factory for IndexStorage to inject projectPath
  container.register(TOKENS.IIndexStorage, {
    useFactory: (c) => {
      return new IndexStorage(
        c.resolve(TOKENS.IFileReader),
        c.resolve(TOKENS.IFileWriter),
        c.resolve(TOKENS.IPathResolver),
        c.resolve(TOKENS.ILogger),
        process.cwd()
      );
    },
  });
}

/**
 * Reset container (useful for testing)
 */
export function resetContainer(): void {
  container.clearInstances();

  // Clean up test index file if it exists
  const fs = require('fs');
  const path = require('path');
  const indexFile = path.join(process.cwd(), '.index-agent-state.json');
  if (fs.existsSync(indexFile)) {
    fs.unlinkSync(indexFile);
  }
}
