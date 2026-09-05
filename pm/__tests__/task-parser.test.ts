/**
 * Tests for TaskParser
 */

import 'reflect-metadata';

import { TaskParser } from '../src/tools/task-parser';
import { IFileReader, IFileStats, IPathResolver } from '../src/interfaces/core';

const makePathResolver = (): jest.Mocked<IPathResolver> => ({
  join: jest.fn((...paths: string[]) => paths.join('/')),
  resolve: jest.fn((...paths: string[]) => paths.join('/')),
  dirname: jest.fn(),
  basename: jest.fn(),
  extname: jest.fn(),
});

const makeFileReader = (): jest.Mocked<IFileReader> => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  readdirSync: jest.fn(),
});

const makeStats = (isDirectory: boolean): IFileStats => ({
  isDirectory: () => isDirectory,
  isFile: () => !isDirectory,
  size: 0,
  mtime: new Date(),
});

describe('TaskParser', () => {
  let fileReader: jest.Mocked<IFileReader>;
  let pathResolver: jest.Mocked<IPathResolver>;
  let parser: TaskParser;

  beforeEach(() => {
    fileReader = makeFileReader();
    pathResolver = makePathResolver();
    parser = new TaskParser(fileReader, pathResolver);
  });

  describe('parseFile', () => {
    it('extracts TODO, FIXME, HACK, and NOTE comments', () => {
      fileReader.readFileSync.mockReturnValue(
        [
          '// TODO: fix this #urgent',
          '// FIXME: broken thing',
          '// HACK: workaround',
          '// NOTE: reminder',
          'const x = 1;',
        ].join('\n')
      );

      const tasks = parser.parseFile('file.ts');

      expect(tasks).toHaveLength(4);
      expect(tasks[0]).toMatchObject({
        id: 'file.ts:1',
        description: 'fix this #urgent',
        type: 'todo',
        file: 'file.ts',
        line: 1,
        priority: 2,
        dependencies: [],
        tags: ['urgent'],
      });
      expect(tasks[1]).toMatchObject({ type: 'fixme', priority: 3, line: 2 });
      expect(tasks[2]).toMatchObject({ type: 'hack', priority: 1, line: 3 });
      expect(tasks[3]).toMatchObject({ type: 'note', priority: 0, line: 4 });
    });

    it('returns no tasks when there are no matching comments', () => {
      fileReader.readFileSync.mockReturnValue('const x = 1;\nconst y = 2;');

      expect(parser.parseFile('file.ts')).toEqual([]);
    });

    it('extracts multiple tags from a single comment', () => {
      fileReader.readFileSync.mockReturnValue('// TODO: fix #a #b');

      const tasks = parser.parseFile('file.ts');
      expect(tasks[0].tags).toEqual(['a', 'b']);
    });

    it('handles multiple matches on the same line', () => {
      fileReader.readFileSync.mockReturnValue('// TODO: first // TODO: second');

      const tasks = parser.parseFile('file.ts');
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parseDirectory', () => {
    it('recurses into subdirectories and parses matching files', () => {
      fileReader.readdirSync.mockImplementation((dir: string) => {
        if (dir === '/proj') return ['sub', 'a.ts', 'a.md'];
        if (dir === '/proj/sub') return ['b.js'];
        return [];
      });
      fileReader.statSync.mockImplementation((filePath: string) => {
        if (filePath === '/proj/sub') return makeStats(true);
        return makeStats(false);
      });
      fileReader.readFileSync.mockImplementation((filePath: string) => {
        if (filePath === '/proj/a.ts') return '// TODO: from a';
        if (filePath === '/proj/sub/b.js') return '// FIXME: from b';
        return '';
      });

      const tasks = parser.parseDirectory('/proj');

      expect(tasks).toHaveLength(2);
      const files = tasks.map((t) => t.file).sort();
      expect(files).toEqual(['/proj/a.ts', '/proj/sub/b.js']);
      // a.md should be skipped since it doesn't match extensions
    });

    it('skips hidden directories, node_modules, and dist', () => {
      fileReader.readdirSync.mockImplementation((dir: string) => {
        if (dir === '/proj') return ['.git', 'node_modules', 'dist', 'src'];
        if (dir === '/proj/src') return ['c.ts'];
        return [];
      });
      fileReader.statSync.mockImplementation((filePath: string) => {
        if (['/proj/.git', '/proj/node_modules', '/proj/dist', '/proj/src'].includes(filePath)) {
          return makeStats(true);
        }
        return makeStats(false);
      });
      fileReader.readFileSync.mockReturnValue('// TODO: only this one');

      const tasks = parser.parseDirectory('/proj');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].file).toBe('/proj/src/c.ts');
    });

    it('respects a custom extensions list', () => {
      fileReader.readdirSync.mockReturnValue(['a.py', 'b.ts']);
      fileReader.statSync.mockReturnValue(makeStats(false));
      fileReader.readFileSync.mockReturnValue('// TODO: item');

      const tasks = parser.parseDirectory('/proj', ['.py']);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].file).toBe('/proj/a.py');
    });

    it('skips files that throw while being read', () => {
      fileReader.readdirSync.mockReturnValue(['broken.ts', 'ok.ts']);
      fileReader.statSync.mockReturnValue(makeStats(false));
      fileReader.readFileSync.mockImplementation((filePath: string) => {
        if (filePath === '/proj/broken.ts') {
          throw new Error('cannot read');
        }
        return '// TODO: fine';
      });

      const tasks = parser.parseDirectory('/proj');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].file).toBe('/proj/ok.ts');
    });

    it('returns an empty array for an empty directory', () => {
      fileReader.readdirSync.mockReturnValue([]);
      expect(parser.parseDirectory('/proj')).toEqual([]);
    });
  });
});
