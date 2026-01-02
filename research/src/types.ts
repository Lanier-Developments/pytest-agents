/**
 * Type definitions for Research Agent
 */

export interface AgentRequest {
  action: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  status: 'success' | 'error' | 'partial';
  data: Record<string, unknown>;
}

export interface Source {
  id: string;
  url?: string;
  title: string;
  author?: string;
  date?: Date;
  type: 'web' | 'document' | 'api' | 'book' | 'article';
  credibility: number; // 0-10
  content?: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  text: string;
  context: string;
  page?: number;
  line?: number;
}

export interface ResearchResult {
  query: string;
  sources: Source[];
  citations: Citation[];
  summary: string;
  confidence: number;
  timestamp: Date;
}

export interface KnowledgeNode {
  id: string;
  concept: string;
  description: string;
  sources: string[];
  relatedNodes: string[];
  verified: boolean;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: 'supports' | 'contradicts' | 'explains' | 'related';
  strength: number; // 0-1
}
