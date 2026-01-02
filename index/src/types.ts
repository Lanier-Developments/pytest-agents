/**
 * Type definitions for Index Agent
 */

export interface AgentRequest {
  action: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  status: 'success' | 'error' | 'partial';
  data: Record<string, unknown>;
}

export interface Symbol {
  id: string;
  name: string;
  type: 'function' | 'class' | 'variable' | 'constant' | 'interface' | 'type';
  filePath: string;
  line: number;
  column: number;
  scope: 'global' | 'local' | 'module';
  signature?: string;
  documentation?: string;
  references: Reference[];
}

export interface Reference {
  filePath: string;
  line: number;
  column: number;
  type: 'definition' | 'usage' | 'import';
}

export interface FileMetadata {
  path: string;
  language: string;
  size: number;
  lastModified: Date;
  symbols: string[];
  imports: string[];
  exports: string[];
}

export interface CodeIndex {
  symbols: Map<string, Symbol>;
  files: Map<string, FileMetadata>;
  dependencies: DependencyGraph;
  lastUpdated: Date;
}

export interface DependencyGraph {
  nodes: Set<string>;
  edges: DependencyEdge[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'imports' | 'extends' | 'implements' | 'uses';
}

export interface SearchQuery {
  term: string;
  type?: Symbol['type'];
  language?: string;
  filePath?: string;
  fuzzy?: boolean;
}

export interface SearchResult {
  symbol: Symbol;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: number[][];
}
