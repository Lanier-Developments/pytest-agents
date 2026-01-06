/**
 * Integration tests for PM Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { PMAgent } from '../src/agent';
import { TaskTracker } from '../src/capabilities/task-tracking';
import { Task } from '../src/types';

describe('PM Agent Integration Tests', () => {
  beforeEach(() => {
    resetContainer();
    setupContainer();
  });

  describe('Full workflow', () => {
    it('should handle complete task tracking workflow', async () => {
      const agent = container.resolve(PMAgent);

      // Create milestone
      const milestoneResponse = await agent.processRequest({
        action: 'create_milestone',
        params: {
          name: 'Sprint 1',
          description: 'First sprint milestone',
          taskIds: [],
        },
      });

      expect(milestoneResponse.status).toBe('success');

      // Get tasks
      const tasksResponse = await agent.processRequest({
        action: 'get_tasks',
        params: {},
      });

      expect(tasksResponse.status).toBe('success');
    });

    it('should handle dependency analysis workflow', async () => {
      const agent = container.resolve(PMAgent);

      // Analyze dependencies (empty graph)
      const analysisResponse = await agent.processRequest({
        action: 'analyze_dependencies',
        params: {},
      });

      expect(analysisResponse.status).toBe('success');
      expect(analysisResponse.data.nodeCount).toBe(0);
      expect(analysisResponse.data.edgeCount).toBe(0);
    });
  });

  describe('Task tracking with real data', () => {
    it('should track tasks and create milestones', () => {
      const tracker = container.resolve(TaskTracker);

      // Add some tasks
      const tasks: Task[] = [
        {
          id: 'task1',
          description: 'Implement feature A',
          type: 'todo',
          file: 'feature.ts',
          line: 10,
          priority: 2,
          dependencies: [],
          tags: ['feature', 'backend'],
          createdAt: new Date(),
        },
        {
          id: 'task2',
          description: 'Fix bug in authentication',
          type: 'fixme',
          file: 'auth.ts',
          line: 42,
          priority: 3,
          dependencies: [],
          tags: ['bug', 'backend'],
          createdAt: new Date(),
        },
        {
          id: 'task3',
          description: 'Update documentation',
          type: 'todo',
          file: 'README.md',
          line: 1,
          priority: 1,
          dependencies: [],
          tags: ['docs'],
          createdAt: new Date(),
        },
      ];

      tasks.forEach((task) => tracker.addTask(task));

      // Verify tasks are tracked
      expect(tracker.getAllTasks()).toHaveLength(3);

      // Get backend tasks
      const backendTasks = tracker.getTasksByTag('backend');
      expect(backendTasks).toHaveLength(2);

      // Get high priority tasks
      const highPriority = tracker.getTasksByPriority(2);
      expect(highPriority.length).toBeGreaterThan(0);
    });
  });
});
