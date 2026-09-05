/**
 * Tests for DependencyAnalyzer
 */

import 'reflect-metadata';

import { DependencyAnalyzer } from '../src/capabilities/dependency-analysis';
import { ILogger } from '../src/interfaces/core';
import { Task, DependencyGraph } from '../src/types';

const makeLogger = (): jest.Mocked<ILogger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const makeTask = (id: string, dependencies: string[] = []): Task => ({
  id,
  description: `task ${id}`,
  type: 'todo',
  file: 'test.ts',
  line: 1,
  priority: 1,
  dependencies,
  tags: [],
  createdAt: new Date(),
});

describe('DependencyAnalyzer', () => {
  let logger: jest.Mocked<ILogger>;
  let analyzer: DependencyAnalyzer;

  beforeEach(() => {
    logger = makeLogger();
    analyzer = new DependencyAnalyzer(logger);
  });

  describe('buildDependencyGraph', () => {
    it('builds nodes and edges from explicit dependencies', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b');
      const graph = analyzer.buildDependencyGraph([a, b]);

      expect(graph.nodes.size).toBe(2);
      expect(graph.nodes.get('a')).toEqual(a);
      expect(graph.edges).toEqual([{ from: 'a', to: 'b', type: 'blocks' }]);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Built dependency graph: 2 nodes, 1 edges')
      );
    });

    it('ignores dependencies that reference unknown tasks', () => {
      const a = makeTask('a', ['missing']);
      const graph = analyzer.buildDependencyGraph([a]);

      expect(graph.edges).toEqual([]);
    });

    it('handles an empty task list', () => {
      const graph = analyzer.buildDependencyGraph([]);
      expect(graph.nodes.size).toBe(0);
      expect(graph.edges).toEqual([]);
    });
  });

  describe('findBlockers', () => {
    it('returns tasks that block the given task', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b');
      const graph = analyzer.buildDependencyGraph([a, b]);

      const blockers = analyzer.findBlockers('a', graph);
      expect(blockers).toEqual([b]);
    });

    it('returns an empty array when there are no blockers', () => {
      const a = makeTask('a');
      const graph = analyzer.buildDependencyGraph([a]);

      expect(analyzer.findBlockers('a', graph)).toEqual([]);
    });

    it('skips edges whose target node is missing from the graph', () => {
      const graph: DependencyGraph = {
        nodes: new Map(),
        edges: [{ from: 'a', to: 'ghost', type: 'blocks' }],
      };

      expect(analyzer.findBlockers('a', graph)).toEqual([]);
    });
  });

  describe('findBlocked', () => {
    it('returns tasks that are blocked by the given task', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b');
      const graph = analyzer.buildDependencyGraph([a, b]);

      expect(analyzer.findBlocked('b', graph)).toEqual([a]);
    });

    it('returns an empty array when nothing is blocked', () => {
      const b = makeTask('b');
      const graph = analyzer.buildDependencyGraph([b]);

      expect(analyzer.findBlocked('b', graph)).toEqual([]);
    });

    it('skips edges whose source node is missing from the graph', () => {
      const graph: DependencyGraph = {
        nodes: new Map(),
        edges: [{ from: 'ghost', to: 'b', type: 'blocks' }],
      };

      expect(analyzer.findBlocked('b', graph)).toEqual([]);
    });
  });

  describe('detectCycles', () => {
    it('returns an empty array for an acyclic graph', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b');
      const graph = analyzer.buildDependencyGraph([a, b]);

      expect(analyzer.detectCycles(graph)).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('detects a simple cycle', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b', ['a']);
      const graph = analyzer.buildDependencyGraph([a, b]);

      const cycles = analyzer.detectCycles(graph);
      expect(cycles.length).toBeGreaterThan(0);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Detected'));
    });

    it('detects a self-referencing cycle', () => {
      const a = makeTask('a', ['a']);
      const graph = analyzer.buildDependencyGraph([a]);

      const cycles = analyzer.detectCycles(graph);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('handles disconnected components', () => {
      const a = makeTask('a');
      const b = makeTask('b');
      const c = makeTask('c', ['b']);
      const graph = analyzer.buildDependencyGraph([a, b, c]);

      expect(analyzer.detectCycles(graph)).toEqual([]);
    });
  });

  describe('getTopologicalOrder', () => {
    it('returns a valid order for an acyclic graph', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b', ['c']);
      const c = makeTask('c');
      const graph = analyzer.buildDependencyGraph([a, b, c]);

      const order = analyzer.getTopologicalOrder(graph);
      expect(order).not.toBeNull();
      expect(order).toHaveLength(3);
      // c has no dependencies so it must come before b, and b before a
      expect(order!.indexOf('c')).toBeLessThan(order!.indexOf('b'));
      expect(order!.indexOf('b')).toBeLessThan(order!.indexOf('a'));
    });

    it('returns an empty order for an empty graph', () => {
      const graph = analyzer.buildDependencyGraph([]);
      expect(analyzer.getTopologicalOrder(graph)).toEqual([]);
    });

    it('returns null and logs an error when the graph contains a cycle', () => {
      const a = makeTask('a', ['b']);
      const b = makeTask('b', ['a']);
      const graph = analyzer.buildDependencyGraph([a, b]);

      const order = analyzer.getTopologicalOrder(graph);
      expect(order).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create topological order')
      );
    });
  });
});
