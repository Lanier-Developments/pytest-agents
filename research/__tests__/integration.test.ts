/**
 * Integration tests for Research Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { ResearchAgent } from '../src/agent';

describe('Research Agent Integration Tests', () => {
  beforeEach(() => {
    resetContainer();
    setupContainer();
  });

  describe('Full workflow', () => {
    it('should handle complete research workflow', async () => {
      const agent = container.resolve(ResearchAgent);

      // Add a source
      const sourceResponse = await agent.processRequest({
        action: 'add_source',
        params: {
          title: 'Research Paper on AI',
          author: 'Dr. Smith',
          url: 'https://example.edu/paper.pdf',
        },
      });

      expect(sourceResponse.status).toBe('success');
      const source = sourceResponse.data.source as any;

      // Create a citation
      const citationResponse = await agent.processRequest({
        action: 'create_citation',
        params: {
          sourceId: source.id,
          text: 'AI is transforming the world',
          context: 'Introduction to artificial intelligence',
        },
      });

      expect(citationResponse.status).toBe('success');

      // Generate bibliography
      const bibResponse = await agent.processRequest({
        action: 'generate_bibliography',
        params: {
          style: 'apa',
        },
      });

      expect(bibResponse.status).toBe('success');
      expect(bibResponse.data.count).toBeGreaterThan(0);
    });

    it('should handle knowledge graph workflow', async () => {
      const agent = container.resolve(ResearchAgent);

      // Add knowledge
      const knowledgeResponse = await agent.processRequest({
        action: 'add_knowledge',
        params: {
          concept: 'Machine Learning',
          description: 'A subset of artificial intelligence',
          sources: ['source1', 'source2'],
        },
      });

      expect(knowledgeResponse.status).toBe('success');
      const node = knowledgeResponse.data.node as any;

      // Find related (should be empty initially)
      const relatedResponse = await agent.processRequest({
        action: 'find_related',
        params: {
          nodeId: node.id,
          maxDepth: 1,
        },
      });

      expect(relatedResponse.status).toBe('success');
      expect(relatedResponse.data.count).toBe(0);
    });
  });
});
