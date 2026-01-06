/**
 * Dependency Injection container configuration for Research Agent
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
import { DocumentAnalyzer } from '../capabilities/document-analysis';
import { CitationTracker } from '../capabilities/citation-tracker';
import { SourceEvaluator } from '../tools/source-evaluator';
import { Summarizer } from '../tools/summarizer';
import { KnowledgeGraphManager } from '../memory/knowledge-graph';

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

  // Register capability implementations
  container.register(TOKENS.IDocumentAnalyzer, { useClass: DocumentAnalyzer });
  container.register(TOKENS.ICitationTracker, { useClass: CitationTracker });
  container.register(TOKENS.ISourceEvaluator, { useClass: SourceEvaluator });
  container.register(TOKENS.ISummarizer, { useClass: Summarizer });
  container.register(TOKENS.IKnowledgeGraphManager, { useClass: KnowledgeGraphManager });
}

/**
 * Reset container (useful for testing)
 */
export function resetContainer(): void {
  container.clearInstances();
}
