/**
 * Document analysis capability
 */

import { injectable, inject } from 'tsyringe';
import { Source } from '../types';
import { ILogger } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class DocumentAnalyzer {
  constructor(@inject(TOKENS.ILogger) private logger: ILogger) {}

  analyzeDocument(content: string, metadata?: Partial<Source>): Source {
    this.logger.info('Analyzing document');

    const source: Source = {
      id: `doc-${Date.now()}`,
      title: metadata?.title || 'Untitled Document',
      type: metadata?.type || 'document',
      author: metadata?.author,
      date: metadata?.date || new Date(),
      credibility: 5,
      content: content,
      ...metadata,
    };

    this.logger.info(`Analyzed document: ${source.title}`);
    return source;
  }

  extractSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();

    // Simple section extraction based on headings
    const lines = content.split('\n');
    let currentSection = 'Introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check if line is a heading (starts with # or is all caps)
      if (line.match(/^#{1,6}\s+/) || (line === line.toUpperCase() && line.length > 0)) {
        // Save previous section
        if (currentContent.length > 0) {
          sections.set(currentSection, currentContent.join('\n'));
        }

        // Start new section
        currentSection = line.replace(/^#{1,6}\s+/, '').trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections.set(currentSection, currentContent.join('\n'));
    }

    this.logger.info(`Extracted ${sections.size} sections`);
    return sections;
  }

  analyzeReadability(content: string): number {
    // Simple readability score (Flesch Reading Ease approximation)
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    if (sentences === 0 || words === 0) return 0;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Flesch Reading Ease: 206.835 - 1.015(words/sentence) - 84.6(syllables/word)
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Normalize to 0-10
    return Math.max(0, Math.min(10, score / 10));
  }

  private countSyllables(text: string): number {
    // Very simple syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;

    for (const word of words) {
      count += Math.max(1, (word.match(/[aeiouy]+/g) || []).length);
    }

    return count;
  }
}
