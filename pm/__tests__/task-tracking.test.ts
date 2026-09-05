/**
 * Tests for task tracking functionality
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { TaskTracker } from '../src/capabilities/task-tracking';
import { Task } from '../src/types';
import { ITaskParser } from '../src/interfaces/capabilities';
import { ILogger } from '../src/interfaces/core';

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

  describe('trackTasks', () => {
    const makeTask = (id: string): Task => ({
      id,
      description: `task ${id}`,
      type: 'todo',
      file: 'test.ts',
      line: 1,
      priority: 2,
      dependencies: [],
      tags: [],
      createdAt: new Date(),
    });

    it('parses the project directory, stores found tasks, and returns them', async () => {
      const parsedTasks = [makeTask('p1'), makeTask('p2')];
      const parser: jest.Mocked<ITaskParser> = {
        parseFile: jest.fn(),
        parseDirectory: jest.fn().mockReturnValue(parsedTasks),
      };
      const logger: jest.Mocked<ILogger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const trackerWithMocks = new TaskTracker(parser, logger);

      const result = await trackerWithMocks.trackTasks('/project');

      expect(parser.parseDirectory).toHaveBeenCalledWith('/project');
      expect(result).toEqual(parsedTasks);
      expect(trackerWithMocks.getAllTasks()).toHaveLength(2);
      expect(trackerWithMocks.getTask('p1')).toEqual(parsedTasks[0]);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Tracking tasks in /project'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Found 2 tasks'));
    });

    it('handles an empty result from the parser', async () => {
      const parser: jest.Mocked<ITaskParser> = {
        parseFile: jest.fn(),
        parseDirectory: jest.fn().mockReturnValue([]),
      };
      const logger: jest.Mocked<ILogger> = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const trackerWithMocks = new TaskTracker(parser, logger);

      const result = await trackerWithMocks.trackTasks('/empty');

      expect(result).toEqual([]);
      expect(trackerWithMocks.getAllTasks()).toEqual([]);
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
