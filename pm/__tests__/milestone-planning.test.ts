/**
 * Tests for MilestonePlanner
 */

import 'reflect-metadata';

import { MilestonePlanner } from '../src/capabilities/milestone-planning';
import { ILogger } from '../src/interfaces/core';
import { Task } from '../src/types';

const makeLogger = (): jest.Mocked<ILogger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const makeTask = (id: string, tags: string[] = []): Task => ({
  id,
  description: `task ${id}`,
  type: 'todo',
  file: 'test.ts',
  line: 1,
  priority: 1,
  dependencies: [],
  tags,
  createdAt: new Date(),
});

describe('MilestonePlanner', () => {
  let logger: jest.Mocked<ILogger>;
  let planner: MilestonePlanner;

  beforeEach(() => {
    logger = makeLogger();
    planner = new MilestonePlanner(logger);
  });

  describe('createMilestone', () => {
    it('creates a milestone with the given fields', () => {
      const dueDate = new Date('2026-01-01');
      const milestone = planner.createMilestone('M1', 'desc', ['t1', 't2'], dueDate);

      expect(milestone.name).toBe('M1');
      expect(milestone.description).toBe('desc');
      expect(milestone.tasks).toEqual(['t1', 't2']);
      expect(milestone.dueDate).toBe(dueDate);
      expect(milestone.completed).toBe(false);
      expect(milestone.id).toMatch(/^milestone-\d+$/);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Created milestone: M1'));
    });

    it('creates a milestone without a due date', () => {
      const milestone = planner.createMilestone('M2', 'desc', []);
      expect(milestone.dueDate).toBeUndefined();
    });

    it('stores the milestone so it can be retrieved later', () => {
      const created = planner.createMilestone('M3', 'desc', []);
      expect(planner.getMilestone(created.id)).toEqual(created);
    });
  });

  describe('getMilestone', () => {
    it('returns undefined for an unknown id', () => {
      expect(planner.getMilestone('nope')).toBeUndefined();
    });
  });

  describe('getAllMilestones', () => {
    it('returns an empty array when there are no milestones', () => {
      expect(planner.getAllMilestones()).toEqual([]);
    });

    it('returns all created milestones', () => {
      planner.createMilestone('M1', 'd', []);
      planner.createMilestone('M2', 'd', []);
      expect(planner.getAllMilestones()).toHaveLength(2);
    });
  });

  describe('updateMilestone', () => {
    it('updates fields on an existing milestone', () => {
      const created = planner.createMilestone('M1', 'd', []);
      const updated = planner.updateMilestone(created.id, { name: 'Renamed' });

      expect(updated?.name).toBe('Renamed');
      expect(planner.getMilestone(created.id)?.name).toBe('Renamed');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Updated milestone: ${created.id}`)
      );
    });

    it('returns undefined when the milestone does not exist', () => {
      expect(planner.updateMilestone('missing', { name: 'x' })).toBeUndefined();
    });
  });

  describe('completeMilestone', () => {
    it('marks an existing milestone as completed and returns true', () => {
      const created = planner.createMilestone('M1', 'd', []);
      expect(planner.completeMilestone(created.id)).toBe(true);
      expect(planner.getMilestone(created.id)?.completed).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed milestone: M1')
      );
    });

    it('returns false when the milestone does not exist', () => {
      expect(planner.completeMilestone('missing')).toBe(false);
    });
  });

  describe('getMilestoneProgress', () => {
    it('returns 0 when the milestone does not exist', () => {
      expect(planner.getMilestoneProgress('missing', new Set())).toBe(0);
    });

    it('returns 0 when the milestone has no tasks', () => {
      const created = planner.createMilestone('M1', 'd', []);
      expect(planner.getMilestoneProgress(created.id, new Set())).toBe(0);
    });

    it('computes the percentage of completed tasks', () => {
      const created = planner.createMilestone('M1', 'd', ['t1', 't2', 't3', 't4']);
      const progress = planner.getMilestoneProgress(created.id, new Set(['t1', 't2']));
      expect(progress).toBe(50);
    });

    it('returns 100 when all tasks are completed', () => {
      const created = planner.createMilestone('M1', 'd', ['t1', 't2']);
      const progress = planner.getMilestoneProgress(created.id, new Set(['t1', 't2']));
      expect(progress).toBe(100);
    });
  });

  describe('suggestMilestones', () => {
    it('suggests a milestone for tags with 3 or more tasks', () => {
      const tasks = [
        makeTask('a', ['backend']),
        makeTask('b', ['backend']),
        makeTask('c', ['backend']),
      ];

      const suggestions = planner.suggestMilestones(tasks);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Complete backend tasks');
      expect(suggestions[0].tasks).toEqual(['a', 'b', 'c']);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Suggested 1 milestones'));
    });

    it('does not suggest milestones for tags with fewer than 3 tasks', () => {
      const tasks = [makeTask('a', ['backend']), makeTask('b', ['backend'])];
      expect(planner.suggestMilestones(tasks)).toEqual([]);
    });

    it('returns an empty array when there are no tasks', () => {
      expect(planner.suggestMilestones([])).toEqual([]);
    });

    it('handles tasks with multiple tags and untagged tasks', () => {
      const tasks = [
        makeTask('a', ['backend', 'urgent']),
        makeTask('b', ['backend', 'urgent']),
        makeTask('c', ['backend', 'urgent']),
        makeTask('d', []),
      ];

      const suggestions = planner.suggestMilestones(tasks);
      const names = suggestions.map((s) => s.name).sort();
      expect(names).toEqual(['Complete backend tasks', 'Complete urgent tasks']);
    });
  });
});
