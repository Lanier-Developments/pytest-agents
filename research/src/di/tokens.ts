/**
 * Injection tokens for interface-based dependency injection
 */

export const TOKENS = {
  // Core infrastructure
  IFileReader: Symbol.for('IFileReader'),
  IFileWriter: Symbol.for('IFileWriter'),
  ILogger: Symbol.for('ILogger'),
  IPathResolver: Symbol.for('IPathResolver'),
  IMetrics: Symbol.for('IMetrics'),

  // Capabilities
  IDocumentAnalyzer: Symbol.for('IDocumentAnalyzer'),
  ICitationTracker: Symbol.for('ICitationTracker'),
  ISourceEvaluator: Symbol.for('ISourceEvaluator'),
  ISummarizer: Symbol.for('ISummarizer'),
  IKnowledgeGraphManager: Symbol.for('IKnowledgeGraphManager'),
};
