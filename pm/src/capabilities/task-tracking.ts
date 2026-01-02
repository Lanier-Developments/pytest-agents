/**
 * Task tracking capability
 */

import { Task } from '../types';
import { TaskParser } from '../tools/task-parser';
import { logger } from '../utils/logger';

export class TaskTracker {
  private tasks: Map<string, Task>;
  private parser: TaskParser;

  constructor() {
    this.tasks = new Map();
    this.parser = new TaskParser();
  }

  async trackTasks(projectPath: string): Promise<Task[]> {
    logger.info(`Tracking tasks in ${projectPath}`);

    const foundTasks = this.parser.parseDirectory(projectPath);

    for (const task of foundTasks) {
      this.tasks.set(task.id, task);
    }

    logger.info(`Found ${foundTasks.length} tasks`);
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
