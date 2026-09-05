/**
 * Tests for SourceEvaluator
 */

import 'reflect-metadata';

import { SourceEvaluator } from '../src/tools/source-evaluator';
import { Source } from '../src/types';

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 'src-1',
    title: 'Untitled',
    type: 'web',
    credibility: 0,
    ...overrides,
  };
}

describe('SourceEvaluator', () => {
  let evaluator: SourceEvaluator;

  beforeEach(() => {
    evaluator = new SourceEvaluator();
  });

  describe('evaluateCredibility', () => {
    it('scores a bare web source at the base score', () => {
      const score = evaluator.evaluateCredibility(makeSource({ type: 'web' }));
      expect(score).toBe(5);
    });

    it.each([
      ['book', 2],
      ['article', 1],
      ['document', 1],
      ['web', 0],
      ['api', 1],
    ] as const)('adds the type bonus for %s sources', (type, bonus) => {
      const score = evaluator.evaluateCredibility(makeSource({ type }));
      expect(score).toBe(5 + bonus);
    });

    it('adds a point when the source has an author', () => {
      const withAuthor = evaluator.evaluateCredibility(makeSource({ author: 'Jane Doe' }));
      const withoutAuthor = evaluator.evaluateCredibility(makeSource());
      expect(withAuthor).toBe(withoutAuthor + 1);
    });

    it('adds a full point for a source dated within the last year', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 30);
      const score = evaluator.evaluateCredibility(makeSource({ date: recent }));
      expect(score).toBe(6);
    });

    it('adds a half point for a source dated between 1 and 5 years old', () => {
      const older = new Date();
      older.setFullYear(older.getFullYear() - 3);
      const score = evaluator.evaluateCredibility(makeSource({ date: older }));
      expect(score).toBe(5.5);
    });

    it('adds no date bonus for a source older than 5 years', () => {
      const ancient = new Date();
      ancient.setFullYear(ancient.getFullYear() - 10);
      const score = evaluator.evaluateCredibility(makeSource({ date: ancient }));
      expect(score).toBe(5);
    });

    it('adds 2 points for .edu urls', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'http://school.edu/page' })
      );
      expect(score).toBe(7);
    });

    it('adds 2 points for .gov urls', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'http://agency.gov/page' })
      );
      expect(score).toBe(7);
    });

    it('adds 1 point for .org urls', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'http://nonprofit.org/page' })
      );
      expect(score).toBe(6);
    });

    it('adds no domain bonus for other urls', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'http://example.com/page' })
      );
      expect(score).toBe(5);
    });

    it('adds a half point bonus for https urls', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'https://example.com/page' })
      );
      expect(score).toBe(5.5);
    });

    it('combines domain and https bonuses', () => {
      const score = evaluator.evaluateCredibility(
        makeSource({ url: 'https://school.edu/page' })
      );
      expect(score).toBe(7.5);
    });

    it('caps the score at 10 even with every bonus applied', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 1);
      const score = evaluator.evaluateCredibility(
        makeSource({
          type: 'book',
          author: 'Jane Doe',
          date: recent,
          url: 'https://university.edu/paper',
        })
      );
      expect(score).toBe(10);
    });

    it('never returns a score below 0', () => {
      const score = evaluator.evaluateCredibility(makeSource({ type: 'web' }));
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rankSources', () => {
    it('sorts sources by descending credibility', () => {
      const low = makeSource({ id: 'low', type: 'web' });
      const high = makeSource({ id: 'high', type: 'book', author: 'Someone' });

      const ranked = evaluator.rankSources([low, high]);

      expect(ranked[0].id).toBe('high');
      expect(ranked[1].id).toBe('low');
      expect(ranked[0].credibility).toBeGreaterThan(ranked[1].credibility);
    });

    it('returns an empty array when given no sources', () => {
      expect(evaluator.rankSources([])).toEqual([]);
    });
  });

  describe('filterLowQualitySources', () => {
    it('keeps only sources meeting the minimum credibility', () => {
      const low = makeSource({ id: 'low', type: 'web' });
      const high = makeSource({ id: 'high', type: 'book', author: 'Someone' });

      const filtered = evaluator.filterLowQualitySources([low, high], 6);

      expect(filtered.map((s) => s.id)).toEqual(['high']);
    });

    it('uses a default minimum credibility of 5', () => {
      const atThreshold = makeSource({ id: 'at', type: 'web' });
      const filtered = evaluator.filterLowQualitySources([atThreshold]);
      expect(filtered.map((s) => s.id)).toEqual(['at']);
    });

    it('returns an empty array when nothing meets the threshold', () => {
      const low = makeSource({ id: 'low', type: 'web' });
      expect(evaluator.filterLowQualitySources([low], 9)).toEqual([]);
    });
  });
});
