/**
 * Tests for KnowledgeGraphManager
 */

import 'reflect-metadata';

import { KnowledgeGraphManager } from '../src/memory/knowledge-graph';
import { ILogger } from '../src/interfaces/core';

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe('KnowledgeGraphManager', () => {
  let logger: jest.Mocked<ILogger>;
  let manager: KnowledgeGraphManager;

  beforeEach(() => {
    logger = createMockLogger();
    manager = new KnowledgeGraphManager(logger);
  });

  describe('addNode', () => {
    it('adds a node and marks it unverified with fewer than two sources', () => {
      const node = manager.addNode('gravity', 'things fall down', ['source-1']);

      expect(node.concept).toBe('gravity');
      expect(node.description).toBe('things fall down');
      expect(node.sources).toEqual(['source-1']);
      expect(node.relatedNodes).toEqual([]);
      expect(node.verified).toBe(false);
      expect(manager.getNode(node.id)).toEqual(node);
      expect(logger.info).toHaveBeenCalledWith('Added node: gravity');
    });

    it('marks a node verified when it has two or more sources', () => {
      const node = manager.addNode('relativity', 'space and time', ['a', 'b']);
      expect(node.verified).toBe(true);
    });

    it('generates unique ids for successive nodes', () => {
      const node1 = manager.addNode('a', 'desc a', []);
      const node2 = manager.addNode('b', 'desc b', []);
      expect(node1.id).not.toBe(node2.id);
    });
  });

  describe('addEdge', () => {
    it('returns null and logs an error when the "from" node does not exist', () => {
      const to = manager.addNode('to', 'desc', []);
      const edge = manager.addEdge('missing', to.id, 'supports');
      expect(edge).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Cannot add edge: nodes not found');
    });

    it('returns null and logs an error when the "to" node does not exist', () => {
      const from = manager.addNode('from', 'desc', []);
      const edge = manager.addEdge(from.id, 'missing', 'supports');
      expect(edge).toBeNull();
    });

    it('creates an edge with default strength and updates relatedNodes on both sides', () => {
      const from = manager.addNode('from', 'desc', []);
      const to = manager.addNode('to', 'desc', []);

      const edge = manager.addEdge(from.id, to.id, 'supports');

      expect(edge).not.toBeNull();
      expect(edge!.strength).toBe(0.5);
      expect(manager.getNode(from.id)!.relatedNodes).toContain(to.id);
      expect(manager.getNode(to.id)!.relatedNodes).toContain(from.id);
      expect(logger.info).toHaveBeenCalledWith(
        `Added edge: supports (${from.id} -> ${to.id})`
      );
    });

    it('clamps strength above 1 down to 1', () => {
      const from = manager.addNode('from', 'desc', []);
      const to = manager.addNode('to', 'desc', []);
      const edge = manager.addEdge(from.id, to.id, 'supports', 5);
      expect(edge!.strength).toBe(1);
    });

    it('clamps strength below 0 up to 0', () => {
      const from = manager.addNode('from', 'desc', []);
      const to = manager.addNode('to', 'desc', []);
      const edge = manager.addEdge(from.id, to.id, 'supports', -5);
      expect(edge!.strength).toBe(0);
    });

    it('does not duplicate relatedNodes entries when an edge is added twice', () => {
      const from = manager.addNode('from', 'desc', []);
      const to = manager.addNode('to', 'desc', []);
      manager.addEdge(from.id, to.id, 'supports');
      manager.addEdge(from.id, to.id, 'related');

      expect(manager.getNode(from.id)!.relatedNodes).toEqual([to.id]);
      expect(manager.getNode(to.id)!.relatedNodes).toEqual([from.id]);
    });
  });

  describe('getNode', () => {
    it('returns undefined for an unknown id', () => {
      expect(manager.getNode('unknown')).toBeUndefined();
    });
  });

  describe('findNodeByConcept', () => {
    it('finds a node case-insensitively', () => {
      const node = manager.addNode('Gravity', 'desc', []);
      expect(manager.findNodeByConcept('gravity')).toEqual(node);
      expect(manager.findNodeByConcept('GRAVITY')).toEqual(node);
    });

    it('returns undefined when no node matches', () => {
      expect(manager.findNodeByConcept('nonexistent')).toBeUndefined();
    });
  });

  describe('getRelatedNodes', () => {
    it('returns an empty array for an unknown node id', () => {
      expect(manager.getRelatedNodes('unknown')).toEqual([]);
    });

    it('returns directly related nodes at depth 1', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      const c = manager.addNode('c', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');
      manager.addEdge(a.id, c.id, 'supports');

      const related = manager.getRelatedNodes(a.id, 1);
      const relatedIds = related.map((n) => n.id).sort();
      expect(relatedIds).toEqual([b.id, c.id].sort());
    });

    it('does not include the origin node itself', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');

      const related = manager.getRelatedNodes(a.id, 1);
      expect(related.map((n) => n.id)).not.toContain(a.id);
    });

    it('does not reach nodes far outside maxDepth', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      const c = manager.addNode('c', 'desc', []);
      const d = manager.addNode('d', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');
      manager.addEdge(b.id, c.id, 'supports');
      manager.addEdge(c.id, d.id, 'supports');

      const relatedDepth1 = manager.getRelatedNodes(a.id, 1);
      expect(relatedDepth1.map((n) => n.id)).not.toContain(d.id);

      const relatedDepth3 = manager.getRelatedNodes(a.id, 3);
      expect(relatedDepth3.map((n) => n.id)).toContain(d.id);
    });

    it('does not include nodes exactly one hop beyond maxDepth', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      const c = manager.addNode('c', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');
      manager.addEdge(b.id, c.id, 'supports');

      const related = manager.getRelatedNodes(a.id, 1);
      const relatedIds = related.map((n) => n.id);
      expect(relatedIds).toContain(b.id);
      expect(relatedIds).not.toContain(c.id);
    });

    it('returns no related nodes when maxDepth is 0', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');

      expect(manager.getRelatedNodes(a.id, 0)).toEqual([]);
    });

    it('defaults to a maxDepth of 1 when not specified', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      const c = manager.addNode('c', 'desc', []);
      const d = manager.addNode('d', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');
      manager.addEdge(b.id, c.id, 'supports');
      manager.addEdge(c.id, d.id, 'supports');

      const related = manager.getRelatedNodes(a.id);
      expect(related.map((n) => n.id)).not.toContain(d.id);
    });

    it('handles cycles without infinite looping', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');
      manager.addEdge(b.id, a.id, 'supports');

      const related = manager.getRelatedNodes(a.id, 3);
      expect(related.map((n) => n.id)).toEqual([b.id]);
    });
  });

  describe('findConflicts', () => {
    it('returns an empty array when there are no contradicts edges', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');

      expect(manager.findConflicts()).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith('Found 0 conflicts');
    });

    it('returns node pairs connected by a contradicts edge', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'contradicts');

      const conflicts = manager.findConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].node1.id).toBe(a.id);
      expect(conflicts[0].node2.id).toBe(b.id);
      expect(logger.info).toHaveBeenCalledWith('Found 1 conflicts');
    });
  });

  describe('getGraph', () => {
    it('returns the underlying graph structure', () => {
      const a = manager.addNode('a', 'desc', []);
      const graph = manager.getGraph();
      expect(graph.nodes.get(a.id)).toEqual(a);
      expect(graph.edges).toEqual([]);
    });
  });

  describe('clear', () => {
    it('removes all nodes and edges', () => {
      const a = manager.addNode('a', 'desc', []);
      const b = manager.addNode('b', 'desc', []);
      manager.addEdge(a.id, b.id, 'supports');

      manager.clear();

      expect(manager.getGraph().nodes.size).toBe(0);
      expect(manager.getGraph().edges).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith('Cleared knowledge graph');
    });
  });
});
