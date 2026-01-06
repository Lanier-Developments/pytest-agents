/**
 * Citation tracking capability
 */

import { injectable, inject } from 'tsyringe';
import { Citation, Source } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class CitationTracker {
  private citations: Map<string, Citation>;
  private sources: Map<string, Source>;

  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {
    this.citations = new Map();
    this.sources = new Map();
  }

  addSource(source: Source): void {
    this.sources.set(source.id, source);
    this.logger.info(`Added source: ${source.title}`);
  }

  createCitation(sourceId: string, text: string, context: string): Citation | null {
    const source = this.sources.get(sourceId);
    if (!source) {
      this.logger.error(`Source not found: ${sourceId}`);
      return null;
    }

    const citation: Citation = {
      id: `cite-${Date.now()}`,
      sourceId,
      text,
      context,
    };

    this.citations.set(citation.id, citation);
    this.logger.info(`Created citation: ${citation.id}`);
    return citation;
  }

  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  getCitationsBySource(sourceId: string): Citation[] {
    return Array.from(this.citations.values()).filter((c) => c.sourceId === sourceId);
  }

  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  formatCitation(citationId: string, style: 'apa' | 'mla' | 'chicago' = 'apa'): string {
    const citation = this.citations.get(citationId);
    if (!citation) return '';

    const source = this.sources.get(citation.sourceId);
    if (!source) return '';

    switch (style) {
      case 'apa':
        return this.formatAPA(source, citation);
      case 'mla':
        return this.formatMLA(source, citation);
      case 'chicago':
        return this.formatChicago(source, citation);
      default:
        return this.formatAPA(source, citation);
    }
  }

  private formatAPA(source: Source, _citation: Citation): string {
    const author = source.author || 'Unknown';
    const year = source.date ? source.date.getFullYear() : 'n.d.';
    const title = source.title;

    let formatted = `${author} (${year}). ${title}.`;

    if (source.url) {
      formatted += ` Retrieved from ${source.url}`;
    }

    if (_citation.page) {
      formatted += ` (p. ${_citation.page})`;
    }

    return formatted;
  }

  private formatMLA(source: Source, _citation: Citation): string {
    const author = source.author || 'Unknown';
    const title = source.title;

    let formatted = `${author}. "${title}."`;

    if (source.date) {
      formatted += ` ${source.date.getFullYear()}.`;
    }

    if (source.url) {
      formatted += ` ${source.url}.`;
    }

    return formatted;
  }

  private formatChicago(source: Source, _citation: Citation): string {
    const author = source.author || 'Unknown';
    const title = source.title;
    const year = source.date ? source.date.getFullYear() : 'n.d.';

    let formatted = `${author}. ${title}. ${year}.`;

    if (source.url) {
      formatted += ` ${source.url}.`;
    }

    return formatted;
  }

  generateBibliography(style: 'apa' | 'mla' | 'chicago' = 'apa'): string[] {
    const uniqueSources = new Set<string>();
    const bibliography: string[] = [];

    // Get all sources that have citations
    for (const citation of this.citations.values()) {
      if (!uniqueSources.has(citation.sourceId)) {
        uniqueSources.add(citation.sourceId);
        const formatted = this.formatCitation(citation.id, style);
        if (formatted) {
          bibliography.push(formatted);
        }
      }
    }

    return bibliography.sort();
  }
}
