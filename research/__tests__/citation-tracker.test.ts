/**
 * Tests for CitationTracker
 */

import 'reflect-metadata';

import { CitationTracker } from '../src/capabilities/citation-tracker';
import { ILogger } from '../src/interfaces/core';
import { Source } from '../src/types';

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe('CitationTracker', () => {
  let logger: jest.Mocked<ILogger>;
  let tracker: CitationTracker;
  let nowCounter: number;

  beforeEach(() => {
    logger = createMockLogger();
    tracker = new CitationTracker(logger);
    // Citation ids are derived from Date.now(); mock it with an incrementing
    // counter so citations created within the same test never collide.
    nowCounter = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => nowCounter++);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const webSource: Source = {
    id: 'src-1',
    url: 'https://example.com/article',
    title: 'A Great Article',
    author: 'Jane Doe',
    date: new Date('2020-05-01'),
    type: 'web',
    credibility: 8,
  };

  const barebonesSource: Source = {
    id: 'src-2',
    title: 'Untitled Document',
    type: 'document',
    credibility: 5,
  };

  describe('addSource', () => {
    it('stores the source and logs', () => {
      tracker.addSource(webSource);
      expect(logger.info).toHaveBeenCalledWith(`Added source: ${webSource.title}`);
    });
  });

  describe('createCitation', () => {
    it('returns null and logs an error when the source is not found', () => {
      const result = tracker.createCitation('missing-source', 'some text', 'some context');
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Source not found: missing-source');
    });

    it('creates a citation when the source exists', () => {
      tracker.addSource(webSource);
      const citation = tracker.createCitation(webSource.id, 'quoted text', 'surrounding context');

      expect(citation).not.toBeNull();
      expect(citation!.sourceId).toBe(webSource.id);
      expect(citation!.text).toBe('quoted text');
      expect(citation!.context).toBe('surrounding context');
      expect(logger.info).toHaveBeenCalledWith(`Created citation: ${citation!.id}`);
    });
  });

  describe('getCitation', () => {
    it('returns undefined for an unknown id', () => {
      expect(tracker.getCitation('nope')).toBeUndefined();
    });

    it('returns the citation for a known id', () => {
      tracker.addSource(webSource);
      const citation = tracker.createCitation(webSource.id, 'text', 'context')!;
      expect(tracker.getCitation(citation.id)).toEqual(citation);
    });
  });

  describe('getCitationsBySource', () => {
    it('returns only citations for the given source', () => {
      tracker.addSource(webSource);
      tracker.addSource(barebonesSource);
      const c1 = tracker.createCitation(webSource.id, 'text1', 'ctx1')!;
      tracker.createCitation(barebonesSource.id, 'text2', 'ctx2');

      const results = tracker.getCitationsBySource(webSource.id);
      expect(results).toEqual([c1]);
    });

    it('returns an empty array when there are no matches', () => {
      expect(tracker.getCitationsBySource('unknown')).toEqual([]);
    });
  });

  describe('getAllCitations', () => {
    it('returns all citations created so far', () => {
      tracker.addSource(webSource);
      const c1 = tracker.createCitation(webSource.id, 'text1', 'ctx1')!;
      const c2 = tracker.createCitation(webSource.id, 'text2', 'ctx2')!;

      expect(tracker.getAllCitations()).toEqual([c1, c2]);
    });
  });

  describe('formatCitation', () => {
    it('returns an empty string for an unknown citation id', () => {
      expect(tracker.formatCitation('missing')).toBe('');
    });

    describe('apa style', () => {
      it('formats a citation with author, date, url, and page', () => {
        tracker.addSource(webSource);
        const citation = tracker.createCitation(webSource.id, 'text', 'ctx')!;
        citation.page = 42;

        const formatted = tracker.formatCitation(citation.id, 'apa');
        expect(formatted).toContain('Jane Doe');
        expect(formatted).toContain('2020');
        expect(formatted).toContain(webSource.title);
        expect(formatted).toContain(webSource.url);
        expect(formatted).toContain('(p. 42)');
      });

      it('formats a citation with missing author, date, and url', () => {
        tracker.addSource(barebonesSource);
        const citation = tracker.createCitation(barebonesSource.id, 'text', 'ctx')!;

        const formatted = tracker.formatCitation(citation.id, 'apa');
        expect(formatted).toContain('Unknown');
        expect(formatted).toContain('n.d.');
        expect(formatted).not.toContain('Retrieved from');
      });

      it('defaults to apa style when none is provided', () => {
        tracker.addSource(webSource);
        const citation = tracker.createCitation(webSource.id, 'text', 'ctx')!;
        expect(tracker.formatCitation(citation.id)).toBe(tracker.formatCitation(citation.id, 'apa'));
      });
    });

    describe('mla style', () => {
      it('formats a citation with date and url', () => {
        tracker.addSource(webSource);
        const citation = tracker.createCitation(webSource.id, 'text', 'ctx')!;

        const formatted = tracker.formatCitation(citation.id, 'mla');
        expect(formatted).toContain('Jane Doe');
        expect(formatted).toContain(`"${webSource.title}."`);
        expect(formatted).toContain('2020');
        expect(formatted).toContain(webSource.url);
      });

      it('formats a citation without date or url', () => {
        tracker.addSource(barebonesSource);
        const citation = tracker.createCitation(barebonesSource.id, 'text', 'ctx')!;

        const formatted = tracker.formatCitation(citation.id, 'mla');
        expect(formatted).toBe(`Unknown. "${barebonesSource.title}."`);
      });
    });

    describe('chicago style', () => {
      it('formats a citation with date and url', () => {
        tracker.addSource(webSource);
        const citation = tracker.createCitation(webSource.id, 'text', 'ctx')!;

        const formatted = tracker.formatCitation(citation.id, 'chicago');
        expect(formatted).toContain('Jane Doe');
        expect(formatted).toContain(webSource.title);
        expect(formatted).toContain('2020');
        expect(formatted).toContain(webSource.url);
      });

      it('formats a citation without date or url', () => {
        tracker.addSource(barebonesSource);
        const citation = tracker.createCitation(barebonesSource.id, 'text', 'ctx')!;

        const formatted = tracker.formatCitation(citation.id, 'chicago');
        expect(formatted).toBe(`Unknown. ${barebonesSource.title}. n.d.`);
      });
    });
  });

  describe('generateBibliography', () => {
    it('returns an empty array when there are no citations', () => {
      expect(tracker.generateBibliography()).toEqual([]);
    });

    it('returns one formatted entry per unique source, sorted', () => {
      tracker.addSource(webSource);
      tracker.addSource(barebonesSource);
      tracker.createCitation(webSource.id, 'text1', 'ctx1');
      tracker.createCitation(webSource.id, 'text2', 'ctx2');
      tracker.createCitation(barebonesSource.id, 'text3', 'ctx3');

      const bibliography = tracker.generateBibliography('mla');
      expect(bibliography).toHaveLength(2);
      expect(bibliography).toEqual([...bibliography].sort());
    });
  });
});
