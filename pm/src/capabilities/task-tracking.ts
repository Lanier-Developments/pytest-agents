/**
 * Task tracking capability
 */

import { injectable, inject } from 'tsyringe';
import { Task } from '../types';
import { ITaskParser } from '../interfaces/capabilities';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class TaskTracker {
  private tasks: Map<string, Task>;

  constructor(
    @inject(TOKENS.ITaskParser) private parser: ITaskParser,
    @inject(TOKENS.ILogger) private logger: ILogger
  ) {
    this.tasks = new Map();
  }

  async trackTasks(projectPath: string): Promise<Task[]> {
    this.logger.info(`Tracking tasks in ${projectPath}`);

    const foundTasks = this.parser.parseDirectory(projectPath);

    for (const task of foundTasks) {
      this.tasks.set(task.id, task);
    }

    this.logger.info(`Found ${foundTasks.length} tasks`);
    return foundTasks;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByType(type: Task['type']): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.type === type);
  }

  getTasksByPriority(minPriority: number): Task[] {
    return Array.from(this.tasks.values())
      .filter((task) => task.priority >= minPriority)
      .sort((a, b) => b.priority - a.priority);
  }

  getTasksByTag(tag: string): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.tags.includes(tag));
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  removeTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}
