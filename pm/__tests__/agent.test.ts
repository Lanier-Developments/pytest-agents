/**
 * Tests for PM Agent core functionality
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { PMAgent } from '../src/agent';
import { AgentRequest } from '../src/types';

describe('PMAgent', () => {
  let agent: PMAgent;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(PMAgent);
  });

  describe('ping', () => {
    it('should respond to ping', async () => {
      const request: AgentRequest = {
        action: 'ping',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.message).toContain('PM Agent');
    });
  });

  describe('get_tasks', () => {
    it('should return empty array when no tasks', async () => {
      const request: AgentRequest = {
        action: 'get_tasks',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.tasks).toEqual([]);
      expect(response.data.count).toBe(0);
    });
  });

  describe('create_milestone', () => {
    it('should create a milestone', async () => {
      const request: AgentRequest = {
        action: 'create_milestone',
        params: {
          name: 'Test Milestone',
          description: 'A test milestone',
          taskIds: ['task1', 'task2'],
        },
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.milestone).toBeDefined();
      const milestone = response.data.milestone as any;
      expect(milestone.name).toBe('Test Milestone');
      expect(milestone.tasks).toEqual(['task1', 'task2']);
    });
  });

  describe('analyze_dependencies', () => {
    it('should analyze dependencies', async () => {
      const request: AgentRequest = {
        action: 'analyze_dependencies',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.nodeCount).toBeDefined();
      expect(response.data.edgeCount).toBeDefined();
    });
  });

  describe('unknown action', () => {
    it('should return error for unknown action', async () => {
      const request: AgentRequest = {
        action: 'unknown_action',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('error');
      expect(response.data.error).toContain('Unknown action');
    });
  });
});
