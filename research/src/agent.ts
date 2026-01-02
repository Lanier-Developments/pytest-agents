/**
 * Research Agent - Core agent implementation
 */

import { AgentRequest, AgentResponse } from './types';
import { DocumentAnalyzer } from './capabilities/document-analysis';
import { CitationTracker } from './capabilities/citation-tracker';
import { SourceEvaluator } from './tools/source-evaluator';
import { Summarizer } from './tools/summarizer';
import { KnowledgeGraphManager } from './memory/knowledge-graph';
import { logger } from './utils/logger';

export class ResearchAgent {
  private documentAnalyzer: DocumentAnalyzer;
  private citationTracker: CitationTracker;
  private sourceEvaluator: SourceEvaluator;
  private summarizer: Summarizer;
  private knowledgeGraph: KnowledgeGraphManager;

  constructor() {
    this.documentAnalyzer = new DocumentAnalyzer();
    this.citationTracker = new CitationTracker();
    this.sourceEvaluator = new SourceEvaluator();
    this.summarizer = new Summarizer();
    this.knowledgeGraph = new KnowledgeGraphManager();
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    logger.info(`Processing action: ${request.action}`);

    try {
      switch (request.action) {
        case 'ping':
          return this.handlePing();

        case 'analyze_document':
          return this.handleAnalyzeDocument(request.params);

        case 'summarize':
          return this.handleSummarize(request.params);

        case 'add_source':
          return this.handleAddSource(request.params);

        case 'create_citation':
          return this.handleCreateCitation(request.params);

        case 'generate_bibliography':
          return this.handleGenerateBibliography(request.params);

        case 'add_knowledge':
          return this.handleAddKnowledge(request.params);

        case 'find_related':
          return this.handleFindRelated(request.params);

        default:
          return {
            status: 'error',
            data: { error: `Unknown action: ${request.action}` },
          };
      }
    } catch (error) {
      logger.error(`Error processing request: ${error}`);
      return {
        status: 'error',
        data: { error: String(error) },
      };
    }
  }

  private handlePing(): AgentResponse {
    return {
      status: 'success',
      data: { message: 'Research Agent is running', version: '0.1.0' },
    };
  }

  private handleAnalyzeDocument(params: Record<string, unknown>): AgentResponse {
    const content = params.content as string;
    const title = params.title as string | undefined;

    if (!content) {
      return {
        status: 'error',
        data: { error: 'Content is required' },
      };
    }

    const source = this.documentAnalyzer.analyzeDocument(content, { title });
    const sections = this.documentAnalyzer.extractSections(content);
    const readability = this.documentAnalyzer.analyzeReadability(content);

    return {
      status: 'success',
      data: {
        source: { ...source, date: source.date?.toISOString() },
        sectionCount: sections.size,
        sections: Array.from(sections.keys()),
        readability,
      },
    };
  }

  private handleSummarize(params: Record<string, unknown>): AgentResponse {
    const text = params.text as string;
    const maxLength = (params.maxLength as number) || 200;

    if (!text) {
      return {
        status: 'error',
        data: { error: 'Text is required' },
      };
    }

    const summary = this.summarizer.summarize(text, maxLength);
    const keyPhrases = this.summarizer.extractKeyPhrases(text);

    return {
      status: 'success',
      data: {
        summary,
        keyPhrases,
        originalLength: text.length,
        summaryLength: summary.length,
      },
    };
  }

  private handleAddSource(params: Record<string, unknown>): AgentResponse {
    const title = params.title as string;
    const url = params.url as string | undefined;
    const author = params.author as string | undefined;
    const type = (params.type as string) || 'web';

    if (!title) {
      return {
        status: 'error',
        data: { error: 'Title is required' },
      };
    }

    const source = {
      id: `source-${Date.now()}`,
      title,
      url,
      author,
      type: type as any,
      date: new Date(),
      credibility: 5,
    };

    const evaluatedSource = {
      ...source,
      credibility: this.sourceEvaluator.evaluateCredibility(source),
    };

    this.citationTracker.addSource(evaluatedSource);

    return {
      status: 'success',
      data: { source: { ...evaluatedSource, date: evaluatedSource.date.toISOString() } },
    };
  }

  private handleCreateCitation(params: Record<string, unknown>): AgentResponse {
    const sourceId = params.sourceId as string;
    const text = params.text as string;
    const context = params.context as string;

    if (!sourceId || !text || !context) {
      return {
        status: 'error',
        data: { error: 'sourceId, text, and context are required' },
      };
    }

    const citation = this.citationTracker.createCitation(sourceId, text, context);

    if (!citation) {
      return {
        status: 'error',
        data: { error: 'Failed to create citation' },
      };
    }

    return {
      status: 'success',
      data: { citation },
    };
  }

  private handleGenerateBibliography(params: Record<string, unknown>): AgentResponse {
    const style = (params.style as 'apa' | 'mla' | 'chicago') || 'apa';
    const bibliography = this.citationTracker.generateBibliography(style);

    return {
      status: 'success',
      data: {
        bibliography,
        count: bibliography.length,
        style,
      },
    };
  }

  private handleAddKnowledge(params: Record<string, unknown>): AgentResponse {
    const concept = params.concept as string;
    const description = params.description as string;
    const sources = (params.sources as string[]) || [];

    if (!concept || !description) {
      return {
        status: 'error',
        data: { error: 'concept and description are required' },
      };
    }

    const node = this.knowledgeGraph.addNode(concept, description, sources);

    return {
      status: 'success',
      data: { node },
    };
  }

  private handleFindRelated(params: Record<string, unknown>): AgentResponse {
    const nodeId = params.nodeId as string;
    const maxDepth = (params.maxDepth as number) || 1;

    if (!nodeId) {
      return {
        status: 'error',
        data: { error: 'nodeId is required' },
      };
    }

    const relatedNodes = this.knowledgeGraph.getRelatedNodes(nodeId, maxDepth);

    return {
      status: 'success',
      data: {
        relatedNodes,
        count: relatedNodes.length,
      },
    };
  }
}
