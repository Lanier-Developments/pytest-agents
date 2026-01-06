/**
 * Milestone planning capability
 */

import { injectable, inject } from 'tsyringe';
import { Milestone, Task } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class MilestonePlanner {
  private milestones: Milestone[];

  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {
    this.milestones = [];
  }

  createMilestone(
    name: string,
    description: string,
    taskIds: string[],
    dueDate?: Date
  ): Milestone {
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      name,
      description,
      tasks: taskIds,
      dueDate,
      completed: false,
    };

    this.milestones.push(milestone);
    this.logger.info(`Created milestone: ${name}`);
    return milestone;
  }

  getMilestone(id: string): Milestone | undefined {
    return this.milestones.find((m) => m.id === id);
  }

  getAllMilestones(): Milestone[] {
    return this.milestones;
  }

  updateMilestone(id: string, updates: Partial<Milestone>): Milestone | undefined {
    const milestone = this.getMilestone(id);
    if (milestone) {
      Object.assign(milestone, updates);
      this.logger.info(`Updated milestone: ${id}`);
      return milestone;
    }
    return undefined;
  }

  completeMilestone(id: string): boolean {
    const milestone = this.getMilestone(id);
    if (milestone) {
      milestone.completed = true;
      this.logger.info(`Completed milestone: ${milestone.name}`);
      return true;
    }
    return false;
  }

  getMilestoneProgress(id: string, completedTaskIds: Set<string>): number {
    const milestone = this.getMilestone(id);
    if (!milestone || milestone.tasks.length === 0) {
      return 0;
    }

    const completedCount = milestone.tasks.filter((taskId) =>
      completedTaskIds.has(taskId)
    ).length;
    return (completedCount / milestone.tasks.length) * 100;
  }

  suggestMilestones(tasks: Task[]): Milestone[] {
    // Simple heuristic: group tasks by tags
    const tasksByTag = new Map<string, Task[]>();

    for (const task of tasks) {
      for (const tag of task.tags) {
        if (!tasksByTag.has(tag)) {
          tasksByTag.set(tag, []);
        }
        tasksByTag.get(tag)!.push(task);
      }
    }

    const suggestions: Milestone[] = [];
    for (const [tag, tagTasks] of tasksByTag.entries()) {
      if (tagTasks.length >= 3) {
        suggestions.push({
          id: `suggested-${tag}`,
          name: `Complete ${tag} tasks`,
          description: `Milestone for tasks tagged with #${tag}`,
          tasks: tagTasks.map((t) => t.id),
          completed: false,
        });
      }
    }

    this.logger.info(`Suggested ${suggestions.length} milestones`);
    return suggestions;
  }
}
