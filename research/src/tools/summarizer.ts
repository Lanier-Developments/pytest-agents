/**
 * Text summarization utility
 */

import { injectable } from 'tsyringe';

@injectable()
export class Summarizer {
  summarize(text: string, maxLength: number = 200): string {
    if (!text || text.length === 0) {
      return '';
    }

    // Simple extractive summarization
    const sentences = this.splitIntoSentences(text);

    if (sentences.length === 0) {
      return text.substring(0, maxLength);
    }

    // Score sentences by importance
    const scoredSentences = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentence(sentence, index, sentences.length),
      index,
    }));

    // Sort by score and take top sentences
    scoredSentences.sort((a, b) => b.score - a.score);

    let summary = '';
    let currentLength = 0;
    const selectedSentences: typeof scoredSentences = [];

    for (const item of scoredSentences) {
      if (currentLength + item.sentence.length <= maxLength) {
        selectedSentences.push(item);
        currentLength += item.sentence.length;
      }
    }

    // Re-sort by original order
    selectedSentences.sort((a, b) => a.index - b.index);
    summary = selectedSentences.map((s) => s.sentence).join(' ');

    return summary.trim();
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private scoreSentence(sentence: string, index: number, total: number): number {
    let score = 0;

    // Position score (first and last sentences are important)
    if (index === 0) score += 2;
    if (index === total - 1) score += 1;

    // Length score (medium-length sentences preferred)
    const words = sentence.split(/\s+/);
    if (words.length >= 10 && words.length <= 25) {
      score += 1;
    }

    // Keyword score (simple heuristic)
    const keywords = ['important', 'significant', 'key', 'main', 'primary', 'conclusion'];
    const lowerSentence = sentence.toLowerCase();
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword)) {
        score += 1;
      }
    }

    return score;
  }

  extractKeyPhrases(text: string, count: number = 5): string[] {
    // Simple key phrase extraction
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'is',
      'was',
      'are',
      'were',
    ]);

    const wordFreq = new Map<string, number>();

    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map((e) => e[0]);
  }
}
