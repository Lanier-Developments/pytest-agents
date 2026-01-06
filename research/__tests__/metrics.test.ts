/**
 * Tests for Prometheus metrics collection in Research Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer, TOKENS } from '../src/di/container';
import { ResearchAgent } from '../src/agent';
import { IMetrics } from '../src/interfaces/core';

describe('ResearchAgent Metrics', () => {
  let agent: ResearchAgent;
  let metrics: IMetrics;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(ResearchAgent);
    metrics = container.resolve(TOKENS.IMetrics);
  });

  describe('Request metrics', () => {
    it('should track total requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput.length).toBeGreaterThan(0);
      expect(metricsOutput).toContain('research_agent_requests_total');
      expect(metricsOutput).toContain('action="ping"');
    });

    it('should track request duration', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_request_duration_seconds');
    });

    it('should track success requests', async () => {
      await agent.processRequest({ action: 'ping', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_requests_success_total');
    });

    it('should track error requests', async () => {
      await agent.processRequest({ action: 'unknown_action', params: {} });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_requests_error_total');
    });
  });

  describe('Business metrics', () => {
    it('should track document analysis', async () => {
      await agent.processRequest({
        action: 'analyze_document',
        params: { content: 'Test document content for analysis' },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_documents_analyzed_total');
      expect(metricsOutput).toContain('research_agent_sections_extracted_total');
    });

    it('should track summaries generated', async () => {
      await agent.processRequest({
        action: 'summarize',
        params: { text: 'This is a test text that needs to be summarized' },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_summaries_generated_total');
    });

    it('should track sources added by type', async () => {
      await agent.processRequest({
        action: 'add_source',
        params: {
          title: 'Test Source',
          type: 'book',
          author: 'Test Author',
        },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_sources_added_total');
      expect(metricsOutput).toContain('type="book"');
    });

    it('should track citations created', async () => {
      // First add a source
      const sourceResponse = await agent.processRequest({
        action: 'add_source',
        params: {
          title: 'Test Source',
          author: 'Test Author',
        },
      });

      const sourceId = (sourceResponse.data.source as any).id;

      // Then create a citation
      await agent.processRequest({
        action: 'create_citation',
        params: {
          sourceId,
          text: 'Quoted text',
          context: 'Test context',
        },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_citations_created_total');
    });

    it('should track knowledge nodes added', async () => {
      await agent.processRequest({
        action: 'add_knowledge',
        params: {
          concept: 'Test Concept',
          description: 'Test description of the concept',
        },
      });

      const metricsOutput = await metrics.getMetrics();

      expect(metricsOutput).toContain('research_agent_knowledge_nodes_total');
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
      expect(response.data.metrics).toContain('research_agent_requests_total');
    });
  });
});
