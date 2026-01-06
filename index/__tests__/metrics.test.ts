/**
 * Tests for Prometheus metrics collection in Index Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer, TOKENS } from '../src/di/container';
import { IndexAgent } from '../src/agent';
import { IMetrics } from '../src/interfaces/core';

describe('IndexAgent Metrics', () => {
  let agent: IndexAgent;
  let metrics: IMetrics;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(IndexAgent);
    metrics = container.resolve(TOKENS.IMetrics);
  });

  describe('Request metrics', () => {
    it('should track total requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput.length).toBeGreaterThan(0);
      expect(metricsOutput).toContain('index_agent_requests_total');
      expect(metricsOutput).toContain('action="ping"');
    });

    it('should track request duration', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_request_duration_seconds');
    });

    it('should track success requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_requests_success_total');
    });

    it('should track error requests', async () => {
      await agent.processRequest({ action: 'unknown_action', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_requests_error_total');
    });
  });

  describe('Business metrics', () => {
    it('should track repository indexing', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: __dirname },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_repositories_indexed_total');
      expect(metricsOutput).toContain('index_agent_symbols_total');
      expect(metricsOutput).toContain('index_agent_files_indexed_total');
    });

    it('should track symbols by type', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: __dirname },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_symbols_by_type');
    });

    it('should track searches performed', async () => {
      // First index a repository
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: __dirname },
      });

      // Then perform a search
      await agent.processRequest({
        action: 'search',
        params: { term: 'test' },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('index_agent_searches_performed_total');
    });

    it('should track references found', async () => {
      // First index a repository
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: __dirname },
      });

      // Get first symbol
      const statsResponse = await agent.processRequest({ action: 'get_stats', params: {} });
      if (statsResponse.status === 'success' && statsResponse.data.total > 0) {
        // Find references (may return error if symbol has no references, but still tracks metric)
        await agent.processRequest({
          action: 'find_references',
          params: { symbolId: 'any-symbol-id' },
        });

        const metricsOutput = await metrics.getMetrics();

        expect(metricsOutput).toContain('index_agent_references_found_total');
      }
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
      expect(response.data.metrics).toContain('index_agent_requests_total');
    });
  });
});
