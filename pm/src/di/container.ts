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
  container.register(TOKENS.IFileReader, { useClass: FsFileReader });
  container.register(TOKENS.IFileWriter, { useClass: FsFileWriter });
  container.register(TOKENS.ILogger, { useClass: ConsoleLogger });
  container.register(TOKENS.IPathResolver, { useClass: PathResolver });

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
