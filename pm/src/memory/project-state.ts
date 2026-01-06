/**
 * Project state persistence
 */

import { injectable, inject } from 'tsyringe';
import { ProjectState, Task, Milestone } from '../types';
import { IFileReader, IFileWriter, ILogger, IPathResolver } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class ProjectStateManager {
  private stateFile: string;

  constructor(
    @inject(TOKENS.IFileReader) private fileReader: IFileReader,
    @inject(TOKENS.IFileWriter) private fileWriter: IFileWriter,
    @inject(TOKENS.IPathResolver) private pathResolver: IPathResolver,
    @inject(TOKENS.ILogger) private logger: ILogger,
    projectPath: string
  ) {
    this.stateFile = this.pathResolver.join(projectPath, '.pm-agent-state.json');
  }

  async save(state: ProjectState): Promise<void> {
    const serialized = {
      tasks: Array.from(state.tasks.entries()),
      milestones: state.milestones,
      dependencies: {
        nodes: Array.from(state.dependencies.nodes.entries()),
        edges: state.dependencies.edges,
      },
      lastUpdated: state.lastUpdated.toISOString(),
    };

    this.fileWriter.writeFileSync(this.stateFile, JSON.stringify(serialized, null, 2), 'utf-8');
    this.logger.info(`Saved project state to ${this.stateFile}`);
  }

  async load(): Promise<ProjectState | null> {
    if (!this.fileReader.existsSync(this.stateFile)) {
      this.logger.info('No saved state found');
      return null;
    }

    try {
      const content = this.fileReader.readFileSync(this.stateFile, 'utf-8');
      const data = JSON.parse(content);

      const state: ProjectState = {
        tasks: new Map(data.tasks.map(([id, task]: [string, Task]) => [
          id,
          { ...task, createdAt: new Date(task.createdAt) },
        ])),
        milestones: data.milestones.map((m: Milestone) => ({
          ...m,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
        })),
        dependencies: {
          nodes: new Map(data.dependencies.nodes.map(([id, task]: [string, Task]) => [
            id,
            { ...task, createdAt: new Date(task.createdAt) },
          ])),
          edges: data.dependencies.edges,
        },
        lastUpdated: new Date(data.lastUpdated),
      };

      this.logger.info(`Loaded project state from ${this.stateFile}`);
      return state;
    } catch (error) {
      this.logger.error(`Error loading state: ${error}`);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (this.fileReader.existsSync(this.stateFile)) {
      this.fileWriter.unlinkSync(this.stateFile);
      this.logger.info('Cleared project state');
    }
  }
}
