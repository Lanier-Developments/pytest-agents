/**
 * Tests for summarization functionality
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { setupContainer, resetContainer } from '../src/di/container';
import { Summarizer } from '../src/tools/summarizer';

describe('Summarizer', () => {
  let summarizer: Summarizer;

  beforeEach(() => {
    resetContainer();
    setupContainer();
    summarizer = container.resolve(Summarizer);
  });

  describe('summarize', () => {
    it('should summarize a long text', () => {
      const text =
        'This is the first sentence. This is the second sentence. This is the third sentence. ' +
        'This is the fourth sentence. This is the fifth sentence.';

      const summary = summarizer.summarize(text, 100);

      expect(summary.length).toBeLessThanOrEqual(100);
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty input', () => {
      const summary = summarizer.summarize('', 100);
      expect(summary).toBe('');
    });

    it('should handle text shorter than max length', () => {
      const text = 'Short text.';
      const summary = summarizer.summarize(text, 100);
      expect(summary).toBe('Short text');
    });
  });

  describe('extractKeyPhrases', () => {
    it('should extract key phrases from text', () => {
      const text =
        'The important concept of machine learning involves training models on data. ' +
        'Machine learning is important for artificial intelligence.';

      const keyPhrases = summarizer.extractKeyPhrases(text, 3);

      expect(keyPhrases.length).toBeLessThanOrEqual(3);
      expect(keyPhrases.length).toBeGreaterThan(0);
    });

    it('should filter out stop words', () => {
      const text = 'The the the important important concept';
      const keyPhrases = summarizer.extractKeyPhrases(text);

      expect(keyPhrases).toContain('important');
      expect(keyPhrases).not.toContain('the');
    });
  });
});
