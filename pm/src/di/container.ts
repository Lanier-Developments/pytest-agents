/**
 * Dependency Injection container configuration for PM Agent
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
import { TaskTracker } from '../capabilities/task-tracking';
import { TaskParser } from '../tools/task-parser';
import { MilestonePlanner } from '../capabilities/milestone-planning';
import { DependencyAnalyzer } from '../capabilities/dependency-analysis';
import { ProjectStateManager } from '../memory/project-state';

// Re-export TOKENS for convenience
export { TOKENS };

/**
 * Setup and configure the DI container
 */
export function setupContainer(): void {
  // Register infrastructure implementations
  container.registerSingleton(TOKENS.IFileReader, FsFileReader);
  container.registerSingleton(TOKENS.IFileWriter, FsFileWriter);
  container.registerSingleton(TOKENS.ILogger, ConsoleLogger);
  container.registerSingleton(TOKENS.IPathResolver, PathResolver);
  container.registerSingleton(TOKENS.IMetrics, PrometheusMetrics);

  // Register capability implementations
  container.register(TOKENS.ITaskParser, { useClass: TaskParser });
  container.register(TOKENS.ITaskTracker, { useClass: TaskTracker });
  container.register(TOKENS.IMilestonePlanner, { useClass: MilestonePlanner });
  container.register(TOKENS.IDependencyAnalyzer, { useClass: DependencyAnalyzer });

  // Use factory for ProjectStateManager to inject projectPath
  container.register(TOKENS.IProjectStateManager, {
    useFactory: (c) => {
      return new ProjectStateManager(
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
}
