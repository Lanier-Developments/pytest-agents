/**
 * PM Agent capability interfaces for dependency injection
 */

import { Task, Milestone, DependencyGraph, ProjectState } from '../types';

/**
 * Task tracking capability
 */
export interface ITaskTracker {
  trackTasks(projectPath: string): Promise<Task[]>;
  getTask(id: string): Task | undefined;
  getAllTasks(): Task[];
  getTasksByType(type: Task['type']): Task[];
  getTasksByPriority(minPriority: number): Task[];
  getTasksByTag(tag: string): Task[];
  addTask(task: Task): void;
  removeTask(id: string): boolean;
  clear(): void;
}

/**
 * Task parsing from source files
 */
export interface ITaskParser {
  parseFile(filePath: string): Task[];
  parseDirectory(dirPath: string, extensions?: string[]): Task[];
}

/**
 * Milestone planning capability
 */
export interface IMilestonePlanner {
  createMilestone(
    name: string,
    description: string,
    taskIds: string[],
    dueDate?: Date
  ): Milestone;
  getMilestone(id: string): Milestone | undefined;
  getAllMilestones(): Milestone[];
  updateMilestone(id: string, updates: Partial<Milestone>): boolean;
  deleteMilestone(id: string): boolean;
}

/**
 * Dependency analysis capability
 */
export interface IDependencyAnalyzer {
  buildDependencyGraph(tasks: Task[]): DependencyGraph;
  detectCycles(graph: DependencyGraph): string[][];
  getTopologicalOrder(graph: DependencyGraph): string[];
  analyzeCriticalPath(graph: DependencyGraph): string[];
}

/**
 * Project state management
 */
export interface IProjectStateManager {
  save(state: ProjectState): Promise<void>;
  load(): Promise<ProjectState | null>;
  clear(): Promise<void>;
}
