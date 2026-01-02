/**
 * Project state persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Task, Milestone } from '../types';
import { logger } from '../utils/logger';

export class ProjectStateManager {
  private stateFile: string;

  constructor(projectPath: string) {
    this.stateFile = path.join(projectPath, '.pm-agent-state.json');
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

    fs.writeFileSync(this.stateFile, JSON.stringify(serialized, null, 2), 'utf-8');
    logger.info(`Saved project state to ${this.stateFile}`);
  }

  async load(): Promise<ProjectState | null> {
    if (!fs.existsSync(this.stateFile)) {
      logger.info('No saved state found');
      return null;
    }

    try {
      const content = fs.readFileSync(this.stateFile, 'utf-8');
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

      logger.info(`Loaded project state from ${this.stateFile}`);
      return state;
    } catch (error) {
      logger.error(`Error loading state: ${error}`);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.stateFile)) {
      fs.unlinkSync(this.stateFile);
      logger.info('Cleared project state');
    }
  }
}
