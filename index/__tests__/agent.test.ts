/**
 * Index Agent tests
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { IndexAgent } from '../src/agent';
import * as fs from 'fs';
import * as path from 'path';

describe('IndexAgent', () => {
  let agent: IndexAgent;
  let testDir: string;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    testDir = path.join(__dirname, 'test-project');
    agent = container.resolve(IndexAgent);

    // Create test directory structure
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create test file
    const testFile = path.join(testDir, 'test.ts');
    fs.writeFileSync(
      testFile,
      `
function hello(name: string): void {
  console.log('Hello, ' + name);
}

class Person {
  constructor(public name: string) {}
}

const PI = 3.14159;
`.trim()
    );
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('ping', () => {
    it('should respond to ping', async () => {
      const response = await agent.processRequest({ action: 'ping' });

      expect(response.status).toBe('success');
      expect(response.data).toHaveProperty('agent', 'index');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('capabilities');
      expect(Array.isArray(response.data.capabilities)).toBe(true);
    });
  });

  describe('index_repository', () => {
    it('should index a repository', async () => {
      const response = await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });

      expect(response.status).toBe('success');
      expect(response.data).toHaveProperty('symbolCount');
      expect(response.data).toHaveProperty('fileCount');
      expect(response.data.symbolCount).toBeGreaterThan(0);
      expect(response.data.fileCount).toBe(1);
    });

    it('should detect multiple symbol types', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });

      const statsResponse = await agent.processRequest({ action: 'get_stats' });

      expect(statsResponse.status).toBe('success');
      expect(statsResponse.data.byType).toHaveProperty('function');
      expect(statsResponse.data.byType).toHaveProperty('class');
      expect(statsResponse.data.byType).toHaveProperty('const');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });
    });

    it('should search for symbols', async () => {
      const response = await agent.processRequest({
        action: 'search',
        params: { term: 'hello' },
      });

      expect(response.status).toBe('success');
      expect(response.data.results.length).toBeGreaterThan(0);
      expect(response.data.results[0].symbol.name).toBe('hello');
    });

    it('should return error without search term', async () => {
      const response = await agent.processRequest({
        action: 'search',
        params: {},
      });

      expect(response.status).toBe('error');
      expect(response.error).toContain('Search term is required');
    });

    it('should filter by type', async () => {
      const response = await agent.processRequest({
        action: 'search',
        params: { term: 'Person', type: 'class' },
      });

      expect(response.status).toBe('success');
      expect(response.data.results[0].symbol.type).toBe('class');
    });

    it('should support fuzzy search', async () => {
      const response = await agent.processRequest({
        action: 'search',
        params: { term: 'hlo', fuzzy: true },
      });

      expect(response.status).toBe('success');
      // Fuzzy search should still find 'hello'
      const hasHello = response.data.results.some(
        (r: any) => r.symbol.name === 'hello'
      );
      expect(hasHello).toBe(true);
    });
  });

  describe('get_symbol', () => {
    beforeEach(async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });
    });

    it('should get symbol by id', async () => {
      // First search to get a symbol ID
      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'hello' },
      });

      const symbolId = searchResponse.data.results[0].symbol.id;

      const response = await agent.processRequest({
        action: 'get_symbol',
        params: { symbolId },
      });

      expect(response.status).toBe('success');
      expect(response.data.symbol.name).toBe('hello');
    });

    it('should return error for missing symbolId', async () => {
      const response = await agent.processRequest({
        action: 'get_symbol',
        params: {},
      });

      expect(response.status).toBe('error');
      expect(response.error).toContain('symbolId is required');
    });
  });

  describe('get_stats', () => {
    it('should return error without index', async () => {
      const response = await agent.processRequest({ action: 'get_stats' });

      expect(response.status).toBe('error');
      expect(response.error).toContain('No index loaded');
    });

    it('should return statistics', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });

      const response = await agent.processRequest({ action: 'get_stats' });

      expect(response.status).toBe('success');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('byType');
      expect(response.data).toHaveProperty('fileCount');
      expect(response.data).toHaveProperty('lastUpdated');
    });
  });

  describe('save and load', () => {
    it('should save and load index', async () => {
      // Index repository
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testDir },
      });

      // Save
      const saveResponse = await agent.processRequest({ action: 'save_index' });
      expect(saveResponse.status).toBe('success');

      // Create new agent instance
      const newAgent = container.resolve(IndexAgent);

      // Load
      const loadResponse = await newAgent.processRequest({ action: 'load_index' });
      expect(loadResponse.status).toBe('success');
      expect(loadResponse.data.symbolCount).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle unknown action', async () => {
      const response = await agent.processRequest({ action: 'unknown_action' });

      expect(response.status).toBe('error');
      expect(response.error).toContain('Unknown action');
    });
  });
});
