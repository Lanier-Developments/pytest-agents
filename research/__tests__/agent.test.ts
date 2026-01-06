/**
 * Tests for Research Agent core functionality
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { ResearchAgent } from '../src/agent';
import { AgentRequest } from '../src/types';

describe('ResearchAgent', () => {
  let agent: ResearchAgent;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(ResearchAgent);
  });

  describe('ping', () => {
    it('should respond to ping', async () => {
      const request: AgentRequest = {
        action: 'ping',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.message).toContain('Research Agent');
    });
  });

  describe('summarize', () => {
    it('should summarize text', async () => {
      const request: AgentRequest = {
        action: 'summarize',
        params: {
          text: 'This is a test document. It has multiple sentences. This helps test summarization.',
        },
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.summary).toBeDefined();
      expect(response.data.keyPhrases).toBeDefined();
    });

    it('should return error when text is missing', async () => {
      const request: AgentRequest = {
        action: 'summarize',
        params: {},
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('error');
      expect(response.data.error).toContain('required');
    });
  });

  describe('add_source', () => {
    it('should add a source', async () => {
      const request: AgentRequest = {
        action: 'add_source',
        params: {
          title: 'Test Article',
          url: 'https://example.edu/article',
          author: 'John Doe',
        },
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.source).toBeDefined();
      const source = response.data.source as any;
      expect(source.title).toBe('Test Article');
      expect(source.credibility).toBeGreaterThan(0);
    });
  });

  describe('analyze_document', () => {
    it('should analyze a document', async () => {
      const request: AgentRequest = {
        action: 'analyze_document',
        params: {
          content: '# Introduction\nThis is a test document.\n\n# Conclusion\nThis is the end.',
          title: 'Test Document',
        },
      };

      const response = await agent.processRequest(request);

      expect(response.status).toBe('success');
      expect(response.data.sectionCount).toBeGreaterThan(0);
      expect(response.data.readability).toBeDefined();
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
