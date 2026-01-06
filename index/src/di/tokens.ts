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

  // Tools
  IASTParser: Symbol.for('IASTParser'),

  // Capabilities
  ICodeIndexer: Symbol.for('ICodeIndexer'),
  ISymbolMapper: Symbol.for('ISymbolMapper'),
  ISearchBuilder: Symbol.for('ISearchBuilder'),
  IIndexStorage: Symbol.for('IIndexStorage'),
};
