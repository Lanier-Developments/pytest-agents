/**
 * Research Agent - Core agent implementation
 */

import { injectable, inject } from 'tsyringe';
import { AgentRequest, AgentResponse } from './types';
import {
  IDocumentAnalyzer,
  ICitationTracker,
  ISourceEvaluator,
  ISummarizer,
  IKnowledgeGraphManager,
} from './interfaces/capabilities';
import { ILogger, IMetrics } from './interfaces/core';
import { TOKENS } from './di/tokens';

@injectable()
export class ResearchAgent {
  constructor(
    @inject(TOKENS.IDocumentAnalyzer) private documentAnalyzer: IDocumentAnalyzer,
    @inject(TOKENS.ICitationTracker) private citationTracker: ICitationTracker,
    @inject(TOKENS.ISourceEvaluator) private sourceEvaluator: ISourceEvaluator,
    @inject(TOKENS.ISummarizer) private summarizer: ISummarizer,
    @inject(TOKENS.IKnowledgeGraphManager) private knowledgeGraph: IKnowledgeGraphManager,
    @inject(TOKENS.ILogger) private logger: ILogger,
    @inject(TOKENS.IMetrics) private metrics: IMetrics
  ) {}

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    this.logger.info(`Processing action: ${request.action}`);

    // Track total requests
    this.metrics.incrementCounter('research_agent_requests_total', { action: request.action });

    // Start timer for request duration
    const endTimer = this.metrics.startTimer('research_agent_request_duration_seconds', { action: request.action });

    try {
      let response: AgentResponse;

      switch (request.action) {
        case 'ping':
          response = this.handlePing();
          break;

        case 'analyze_document':
          response = this.handleAnalyzeDocument(request.params);
          break;

        case 'summarize':
          response = this.handleSummarize(request.params);
          break;

        case 'add_source':
          response = this.handleAddSource(request.params);
          break;

        case 'create_citation':
          response = this.handleCreateCitation(request.params);
          break;

        case 'generate_bibliography':
          response = this.handleGenerateBibliography(request.params);
          break;

        case 'add_knowledge':
          response = this.handleAddKnowledge(request.params);
          break;

        case 'find_related':
          response = this.handleFindRelated(request.params);
          break;

        case 'get_metrics':
          response = await this.handleGetMetrics();
          break;

        default:
          response = {
            status: 'error',
            data: { error: `Unknown action: ${request.action}` },
          };
      }

      // Track success/error
      if (response.status === 'success') {
        this.metrics.incrementCounter('research_agent_requests_success_total', { action: request.action });
      } else {
        this.metrics.incrementCounter('research_agent_requests_error_total', { action: request.action });
      }

      endTimer();
      return response;
    } catch (error) {
      this.logger.error(`Error processing request: ${error}`);
      this.metrics.incrementCounter('research_agent_requests_error_total', { action: request.action });
      endTimer();
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

    // Track metrics
    this.metrics.incrementCounter('research_agent_documents_analyzed_total');
    this.metrics.incrementCounter('research_agent_sections_extracted_total');

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

    // Track metrics
    this.metrics.incrementCounter('research_agent_summaries_generated_total');

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

    // Track metrics
    this.metrics.incrementCounter('research_agent_sources_added_total', { type });

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

    // Track metrics
    this.metrics.incrementCounter('research_agent_citations_created_total');

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

    // Track metrics
    this.metrics.incrementCounter('research_agent_knowledge_nodes_total');

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

  private async handleGetMetrics(): Promise<AgentResponse> {
    const metrics = await this.metrics.getMetrics();

    return {
      status: 'success',
      data: {
        metrics,
        format: 'prometheus',
      },
    };
  }
}
