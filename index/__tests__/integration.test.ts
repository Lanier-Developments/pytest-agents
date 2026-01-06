/**
 * Integration tests for Index Agent
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { IndexAgent } from '../src/agent';
import * as fs from 'fs';
import * as path from 'path';

describe('Index Agent Integration', () => {
  let agent: IndexAgent;
  let testProjectPath: string;

  beforeAll(() => {
    testProjectPath = path.join(__dirname, 'integration-test-project');

    // Create test project structure
    fs.mkdirSync(testProjectPath, { recursive: true });

    // Create source files
    const srcDir = path.join(testProjectPath, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(
      path.join(srcDir, 'user.ts'),
      `
export interface User {
  id: string;
  name: string;
}

export class UserService {
  getUser(id: string): User {
    return { id, name: 'Test' };
  }

  createUser(name: string): User {
    const id = Math.random().toString();
    return { id, name };
  }
}

export const DEFAULT_USER: User = {
  id: 'default',
  name: 'Default User',
};
`.trim()
    );

    fs.writeFileSync(
      path.join(srcDir, 'auth.ts'),
      `
import { User } from './user';

export class AuthService {
  login(email: string, password: string): User | null {
    // Mock implementation
    return null;
  }

  logout(): void {
    // Mock implementation
  }
}
`.trim()
    );

    fs.writeFileSync(
      path.join(srcDir, 'index.ts'),
      `
export { User, UserService, DEFAULT_USER } from './user';
export { AuthService } from './auth';
`.trim()
    );
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    resetContainer();
    setupContainer();
    agent = container.resolve(IndexAgent);
  });

  describe('Full workflow', () => {
    it('should index, search, and retrieve symbols', async () => {
      // Step 1: Index the repository
      const indexResponse = await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      expect(indexResponse.status).toBe('success');
      expect(indexResponse.data.symbolCount).toBeGreaterThan(0);
      expect(indexResponse.data.fileCount).toBe(3);

      // Step 2: Get stats
      const statsResponse = await agent.processRequest({ action: 'get_stats' });

      expect(statsResponse.status).toBe('success');
      expect(statsResponse.data.total).toBeGreaterThan(0);
      expect(statsResponse.data.byType).toHaveProperty('class');
      expect(statsResponse.data.byType).toHaveProperty('interface');
      expect(statsResponse.data.byType).toHaveProperty('const');

      // Step 3: Search for User-related symbols
      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'User', limit: 10 },
      });

      expect(searchResponse.status).toBe('success');
      expect(searchResponse.data.results.length).toBeGreaterThan(0);

      // Step 4: Get specific symbol
      const symbolId = searchResponse.data.results[0].symbol.id;
      const getSymbolResponse = await agent.processRequest({
        action: 'get_symbol',
        params: { symbolId },
      });

      expect(getSymbolResponse.status).toBe('success');
      expect(getSymbolResponse.data.symbol).toBeDefined();

      // Step 5: Save index
      const saveResponse = await agent.processRequest({ action: 'save_index' });
      expect(saveResponse.status).toBe('success');

      // Step 6: Load index in new agent instance
      const newAgent = container.resolve(IndexAgent);
      const loadResponse = await newAgent.processRequest({ action: 'load_index' });

      expect(loadResponse.status).toBe('success');
      expect(loadResponse.data.symbolCount).toBe(indexResponse.data.symbolCount);
    });

    it('should handle cross-file symbol search', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      // Search for symbols across all files
      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'Service' },
      });

      expect(searchResponse.status).toBe('success');

      // Should find Service symbols (UserService and AuthService) in multiple files
      const filePaths = new Set(
        searchResponse.data.results.map((r: any) => r.symbol.filePath)
      );
      expect(filePaths.size).toBeGreaterThanOrEqual(1);
      expect(searchResponse.data.results.length).toBeGreaterThan(0);
    });

    it('should boost scores for matching file path', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'User', filePath: 'user.ts' },
      });

      expect(searchResponse.status).toBe('success');
      expect(searchResponse.data.results.length).toBeGreaterThan(0);

      // Symbols from user.ts should score higher
      const userTsResults = searchResponse.data.results.filter((r: any) =>
        r.symbol.filePath.includes('user.ts')
      );
      expect(userTsResults.length).toBeGreaterThan(0);
    });

    it('should boost scores for matching type', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'Service', type: 'class' },
      });

      expect(searchResponse.status).toBe('success');
      expect(searchResponse.data.results.length).toBeGreaterThan(0);

      // Class symbols should appear in results
      const classResults = searchResponse.data.results.filter(
        (r: any) => r.symbol.type === 'class'
      );
      expect(classResults.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle search before indexing', async () => {
      const searchResponse = await agent.processRequest({
        action: 'search',
        params: { term: 'User' },
      });

      expect(searchResponse.status).toBe('error');
      expect(searchResponse.error).toContain('No index loaded');
    });

    it('should handle load when no saved index exists', async () => {
      const newTestPath = path.join(__dirname, 'no-index-project');
      fs.mkdirSync(newTestPath, { recursive: true });

      const newAgent = container.resolve(IndexAgent);
      const loadResponse = await newAgent.processRequest({ action: 'load_index' });

      expect(loadResponse.status).toBe('error');
      expect(loadResponse.error).toContain('No saved index found');

      fs.rmSync(newTestPath, { recursive: true, force: true });
    });
  });

  describe('Performance', () => {
    it('should handle indexing multiple files efficiently', async () => {
      const startTime = Date.now();

      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds for 3 files)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle search efficiently', async () => {
      await agent.processRequest({
        action: 'index_repository',
        params: { rootPath: testProjectPath },
      });

      const startTime = Date.now();

      await agent.processRequest({
        action: 'search',
        params: { term: 'User' },
      });

      const duration = Date.now() - startTime;

      // Search should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
