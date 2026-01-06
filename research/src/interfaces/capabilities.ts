/**
 * Research Agent capability interfaces
 */

import { Source, Citation, KnowledgeNode, KnowledgeGraph } from '../types';

export interface IDocumentAnalyzer {
  analyzeDocument(content: string, metadata?: Partial<Source>): Source;
  extractSections(content: string): Map<string, string>;
  analyzeReadability(content: string): number;
}

export interface ICitationTracker {
  addSource(source: Source): void;
  createCitation(sourceId: string, text: string, context: string): Citation | null;
  getCitation(id: string): Citation | undefined;
  getCitationsBySource(sourceId: string): Citation[];
  getAllCitations(): Citation[];
  formatCitation(citationId: string, style?: 'apa' | 'mla' | 'chicago'): string;
  generateBibliography(style?: 'apa' | 'mla' | 'chicago'): string[];
}

export interface ISourceEvaluator {
  evaluateCredibility(source: Source): number;
  checkFactAccuracy(claim: string, sources: Source[]): number;
  compareSourceReliability(sources: Source[]): Source[];
}

export interface ISummarizer {
  summarize(text: string, maxLength: number): string;
  extractKeyPhrases(text: string, count?: number): string[];
  generateAbstract(text: string): string;
}

export interface IKnowledgeGraphManager {
  addNode(concept: string, description: string, sources: string[]): KnowledgeNode;
  getNode(id: string): KnowledgeNode | undefined;
  getRelatedNodes(nodeId: string, maxDepth?: number): KnowledgeNode[];
  getGraph(): KnowledgeGraph;
  clear(): void;
}
