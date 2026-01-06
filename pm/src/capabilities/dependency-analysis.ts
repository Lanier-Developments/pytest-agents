/**
 * Dependency analysis capability
 */

import { injectable, inject } from 'tsyringe';
import { Task, DependencyGraph } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class DependencyAnalyzer {
  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {}
  buildDependencyGraph(tasks: Task[]): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: [],
    };

    // Add all tasks as nodes
    for (const task of tasks) {
      graph.nodes.set(task.id, task);
    }

    // Build edges from explicit dependencies
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (graph.nodes.has(depId)) {
          graph.edges.push({
            from: task.id,
            to: depId,
            type: 'blocks',
          });
        }
      }
    }

    this.logger.info(`Built dependency graph: ${graph.nodes.size} nodes, ${graph.edges.length} edges`);
    return graph;
  }

  findBlockers(taskId: string, graph: DependencyGraph): Task[] {
    const blockers: Task[] = [];

    for (const edge of graph.edges) {
      if (edge.from === taskId && edge.type === 'blocks') {
        const blocker = graph.nodes.get(edge.to);
        if (blocker) {
          blockers.push(blocker);
        }
      }
    }

    return blockers;
  }

  findBlocked(taskId: string, graph: DependencyGraph): Task[] {
    const blocked: Task[] = [];

    for (const edge of graph.edges) {
      if (edge.to === taskId && edge.type === 'blocks') {
        const blockedTask = graph.nodes.get(edge.from);
        if (blockedTask) {
          blocked.push(blockedTask);
        }
      }
    }

    return blocked;
  }

  detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Find outgoing edges
      const outgoing = graph.edges.filter((e) => e.from === nodeId);

      for (const edge of outgoing) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, [...path]);
        } else if (recursionStack.has(edge.to)) {
          // Found a cycle
          const cycleStart = path.indexOf(edge.to);
          cycles.push([...path.slice(cycleStart), edge.to]);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    if (cycles.length > 0) {
      this.logger.warn(`Detected ${cycles.length} dependency cycles`);
    }

    return cycles;
  }

  getTopologicalOrder(graph: DependencyGraph): string[] | null {
    const inDegree = new Map<string, number>();
    const order: string[] = [];

    // Initialize in-degrees
    for (const nodeId of graph.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    // Calculate in-degrees
    for (const edge of graph.edges) {
      inDegree.set(edge.from, (inDegree.get(edge.from) || 0) + 1);
    }

    // Find nodes with no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      order.push(nodeId);

      // Reduce in-degree for neighbors
      for (const edge of graph.edges) {
        if (edge.to === nodeId) {
          const fromDegree = inDegree.get(edge.from)! - 1;
          inDegree.set(edge.from, fromDegree);

          if (fromDegree === 0) {
            queue.push(edge.from);
          }
        }
      }
    }

    // Check if all nodes were processed (no cycles)
    if (order.length !== graph.nodes.size) {
      this.logger.error('Cannot create topological order: graph contains cycles');
      return null;
    }

    return order;
  }
}
