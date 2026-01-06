/**
 * Tests for task tracking functionality
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { TaskTracker } from '../src/capabilities/task-tracking';
import { Task } from '../src/types';

describe('TaskTracker', () => {
  let tracker: TaskTracker;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    tracker = container.resolve(TaskTracker);
  });

  describe('addTask', () => {
    it('should add a task', () => {
      const task: Task = {
        id: 'test1',
        description: 'Test task',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(task);

      expect(tracker.getTask('test1')).toEqual(task);
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array when no tasks', () => {
      expect(tracker.getAllTasks()).toEqual([]);
    });

    it('should return all tasks', () => {
      const task1: Task = {
        id: 'test1',
        description: 'Test task 1',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      const task2: Task = {
        id: 'test2',
        description: 'Test task 2',
        type: 'fixme',
        file: 'test.ts',
        line: 2,
        priority: 3,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(task1);
      tracker.addTask(task2);

      expect(tracker.getAllTasks()).toHaveLength(2);
    });
  });

  describe('getTasksByType', () => {
    it('should filter tasks by type', () => {
      const todoTask: Task = {
        id: 'test1',
        description: 'TODO task',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      const fixmeTask: Task = {
        id: 'test2',
        description: 'FIXME task',
        type: 'fixme',
        file: 'test.ts',
        line: 2,
        priority: 3,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(todoTask);
      tracker.addTask(fixmeTask);

      const todos = tracker.getTasksByType('todo');
      expect(todos).toHaveLength(1);
      expect(todos[0].type).toBe('todo');
    });
  });

  describe('getTasksByPriority', () => {
    it('should filter and sort tasks by priority', () => {
      const lowPriority: Task = {
        id: 'test1',
        description: 'Low priority',
        type: 'note',
        file: 'test.ts',
        line: 1,
        priority: 1,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      const highPriority: Task = {
        id: 'test2',
        description: 'High priority',
        type: 'fixme',
        file: 'test.ts',
        line: 2,
        priority: 3,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(lowPriority);
      tracker.addTask(highPriority);

      const priorityTasks = tracker.getTasksByPriority(2);
      expect(priorityTasks).toHaveLength(1);
      expect(priorityTasks[0].priority).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTasksByTag', () => {
    it('should filter tasks by tag', () => {
      const taggedTask: Task = {
        id: 'test1',
        description: 'Task with tag',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: ['urgent', 'backend'],
        createdAt: new Date(),
      };

      const untaggedTask: Task = {
        id: 'test2',
        description: 'Task without tag',
        type: 'todo',
        file: 'test.ts',
        line: 2,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(taggedTask);
      tracker.addTask(untaggedTask);

      const urgentTasks = tracker.getTasksByTag('urgent');
      expect(urgentTasks).toHaveLength(1);
      expect(urgentTasks[0].tags).toContain('urgent');
    });
  });

  describe('removeTask', () => {
    it('should remove a task', () => {
      const task: Task = {
        id: 'test1',
        description: 'Test task',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(task);
      expect(tracker.getTask('test1')).toBeDefined();

      tracker.removeTask('test1');
      expect(tracker.getTask('test1')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all tasks', () => {
      const task: Task = {
        id: 'test1',
        description: 'Test task',
        type: 'todo',
        file: 'test.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: [],
        createdAt: new Date(),
      };

      tracker.addTask(task);
      expect(tracker.getAllTasks()).toHaveLength(1);

      tracker.clear();
      expect(tracker.getAllTasks()).toHaveLength(0);
    });
  });
});
