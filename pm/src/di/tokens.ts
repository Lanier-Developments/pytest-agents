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
  ITaskTracker: Symbol.for('ITaskTracker'),
  ITaskParser: Symbol.for('ITaskParser'),
  IMilestonePlanner: Symbol.for('ITaskPlanner'),
  IDependencyAnalyzer: Symbol.for('IDependencyAnalyzer'),
  IProjectStateManager: Symbol.for('IProjectStateManager'),
};
