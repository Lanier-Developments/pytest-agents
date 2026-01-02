/**
 * Type definitions for PM Agent
 */

export interface AgentRequest {
  action: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  status: 'success' | 'error' | 'partial';
  data: Record<string, unknown>;
}

export interface Task {
  id: string;
  description: string;
  type: 'todo' | 'fixme' | 'hack' | 'note';
  file: string;
  line: number;
  priority: number;
  dependencies: string[];
  tags: string[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  dueDate?: Date;
  completed: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'blocks' | 'requires' | 'related';
}

export interface DependencyGraph {
  nodes: Map<string, Task>;
  edges: DependencyEdge[];
}

export interface ProjectState {
  tasks: Map<string, Task>;
  milestones: Milestone[];
  dependencies: DependencyGraph;
  lastUpdated: Date;
}
