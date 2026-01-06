/**
 * Knowledge graph for storing research findings
 */

import { injectable, inject } from 'tsyringe';
import { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class KnowledgeGraphManager {
  private graph: KnowledgeGraph;

  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {
    this.graph = {
      nodes: new Map(),
      edges: [],
    };
  }

  addNode(concept: string, description: string, sources: string[]): KnowledgeNode {
    const node: KnowledgeNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      concept,
      description,
      sources,
      relatedNodes: [],
      verified: sources.length >= 2, // Verified if multiple sources
    };

    this.graph.nodes.set(node.id, node);
    this.logger.info(`Added node: ${concept}`);
    return node;
  }

  addEdge(
    fromId: string,
    toId: string,
    relationship: KnowledgeEdge['relationship'],
    strength: number = 0.5
  ): KnowledgeEdge | null {
    if (!this.graph.nodes.has(fromId) || !this.graph.nodes.has(toId)) {
      this.logger.error('Cannot add edge: nodes not found');
      return null;
    }

    const edge: KnowledgeEdge = {
      from: fromId,
      to: toId,
      relationship,
      strength: Math.max(0, Math.min(1, strength)),
    };

    this.graph.edges.push(edge);

    // Update related nodes
    const fromNode = this.graph.nodes.get(fromId);
    const toNode = this.graph.nodes.get(toId);
    if (fromNode && toNode) {
      if (!fromNode.relatedNodes.includes(toId)) {
        fromNode.relatedNodes.push(toId);
      }
      if (!toNode.relatedNodes.includes(fromId)) {
        toNode.relatedNodes.push(fromId);
      }
    }

    this.logger.info(`Added edge: ${relationship} (${fromId} -> ${toId})`);
    return edge;
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.graph.nodes.get(id);
  }

  findNodeByConcept(concept: string): KnowledgeNode | undefined {
    const normalized = concept.toLowerCase();
    return Array.from(this.graph.nodes.values()).find(
      (node) => node.concept.toLowerCase() === normalized
    );
  }

  getRelatedNodes(nodeId: string, maxDepth: number = 1): KnowledgeNode[] {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return [];

    const related = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.depth > maxDepth) continue;

      visited.add(current.id);
      const currentNode = this.graph.nodes.get(current.id);
      if (!currentNode) continue;

      for (const relatedId of currentNode.relatedNodes) {
        if (relatedId !== nodeId) {
          related.add(relatedId);
        }
        if (current.depth < maxDepth) {
          queue.push({ id: relatedId, depth: current.depth + 1 });
        }
      }
    }

    return Array.from(related)
      .map((id) => this.graph.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  findConflicts(): Array<{ node1: KnowledgeNode; node2: KnowledgeNode; edge: KnowledgeEdge }> {
    const conflicts: Array<{
      node1: KnowledgeNode;
      node2: KnowledgeNode;
      edge: KnowledgeEdge;
    }> = [];

    for (const edge of this.graph.edges) {
      if (edge.relationship === 'contradicts') {
        const node1 = this.graph.nodes.get(edge.from);
        const node2 = this.graph.nodes.get(edge.to);
        if (node1 && node2) {
          conflicts.push({ node1, node2, edge });
        }
      }
    }

    this.logger.info(`Found ${conflicts.length} conflicts`);
    return conflicts;
  }

  getGraph(): KnowledgeGraph {
    return this.graph;
  }

  clear(): void {
    this.graph.nodes.clear();
    this.graph.edges = [];
    this.logger.info('Cleared knowledge graph');
  }
}
