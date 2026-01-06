/**
 * Source credibility evaluation
 */

import { injectable } from 'tsyringe';
import { Source } from '../types';

@injectable()
export class SourceEvaluator {
  evaluateCredibility(source: Source): number {
    let score = 5; // Base score

    // Evaluate based on source type
    const typeScores: Record<Source['type'], number> = {
      book: 2,
      article: 1,
      document: 1,
      web: 0,
      api: 1,
    };
    score += typeScores[source.type] || 0;

    // Has author
    if (source.author) {
      score += 1;
    }

    // Has date (more recent is better)
    if (source.date) {
      const ageInDays = (Date.now() - source.date.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 365) score += 1;
      else if (ageInDays < 1825) score += 0.5; // 5 years
    }

    // Check URL quality (if web source)
    if (source.url) {
      const url = source.url.toLowerCase();
      if (url.includes('.edu') || url.includes('.gov')) {
        score += 2;
      } else if (url.includes('.org')) {
        score += 1;
      }

      // HTTPS is better
      if (url.startsWith('https://')) {
        score += 0.5;
      }
    }

    // Cap at 10
    return Math.min(10, Math.max(0, score));
  }

  rankSources(sources: Source[]): Source[] {
    return sources
      .map((source) => ({
        ...source,
        credibility: this.evaluateCredibility(source),
      }))
      .sort((a, b) => b.credibility - a.credibility);
  }

  filterLowQualitySources(sources: Source[], minCredibility: number = 5): Source[] {
    return sources.filter((s) => this.evaluateCredibility(s) >= minCredibility);
  }
}
