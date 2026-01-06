/**
 * Tests for Prometheus metrics collection
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer, TOKENS } from '../src/di/container';
import { PMAgent } from '../src/agent';
import { IMetrics } from '../src/interfaces/core';

describe('PMAgent Metrics', () => {
  let agent: PMAgent;
  let metrics: IMetrics;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(PMAgent);
    metrics = container.resolve(TOKENS.IMetrics);
  });

  describe('Request metrics', () => {
    it('should track total requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      // Debug: log what we actually got
      if (metricsOutput.length === 0) {
        console.log('WARNING: Metrics output is empty');
      }

      expect(metricsOutput.length).toBeGreaterThan(0);
      expect(metricsOutput).toContain('pm_agent_requests_total');
      expect(metricsOutput).toContain('action="ping"');
    });

    it('should track request duration', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('pm_agent_request_duration_seconds');
    });

    it('should track success requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('pm_agent_requests_success_total');
    });

    it('should track error requests', async () => {
      await agent.processRequest({ action: 'unknown_action', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('pm_agent_requests_error_total');
    });
  });

  describe('get_metrics action', () => {
    it('should return metrics in prometheus format', async () => {
      // Generate some metrics first
      await agent.processRequest({ action: 'ping', params: {} });

      // Get metrics via agent action
      const response = await agent.processRequest({ action: 'get_metrics', params: {} });

      expect(response.status).toBe('success');
      expect(response.data.format).toBe('prometheus');
      expect(response.data.metrics).toBeDefined();
      expect(response.data.metrics).toContain('pm_agent_requests_total');
    });
  });
});
