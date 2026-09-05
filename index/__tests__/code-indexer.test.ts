/**
 * Tests for CodeIndexer
 */

import 'reflect-metadata';

import { CodeIndexer } from '../src/capabilities/code-indexer';
import { ASTParser } from '../src/tools/ast-parser';
import { IFileReader, IFileStats, ILogger, IPathResolver } from '../src/interfaces/core';
import { CodeIndex, FileMetadata, Symbol } from '../src/types';

function makeStats(isDirectory: boolean): IFileStats {
  return {
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    size: 42,
    mtime: new Date('2024-01-01T00:00:00.000Z'),
  };
}

function makeLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function makePathResolver(): jest.Mocked<IPathResolver> {
  return {
    join: jest.fn((...parts: string[]) => parts.join('/')),
    resolve: jest.fn((...parts: string[]) => parts.join('/')),
    dirname: jest.fn(),
    basename: jest.fn(),
    extname: jest.fn(),
  };
}

function makeSymbol(id: string, filePath: string): Symbol {
  return {
    id,
    name: id,
    type: 'function',
    filePath,
    line: 1,
    column: 0,
    scope: 'module',
    references: [],
  };
}

function makeParser(): jest.Mocked<Pick<ASTParser, 'parseFile' | 'detectLanguage' | 'extractImports' | 'extractExports'>> {
  return {
    parseFile: jest.fn().mockReturnValue([]),
    detectLanguage: jest.fn().mockReturnValue('typescript'),
    extractImports: jest.fn().mockReturnValue([]),
    extractExports: jest.fn().mockReturnValue([]),
  };
}

describe('CodeIndexer', () => {
  describe('indexRepository', () => {
    it('walks the directory tree, skipping ignored directories, and indexes matching files', async () => {
      const dirEntries: Record<string, string[]> = {
        '/root': ['file1.ts', 'node_modules', '.hidden', 'dist', '__pycache__', 'sub', 'file3.txt'],
        '/root/node_modules': ['shouldskip.ts'],
        '/root/.hidden': ['shouldskip.ts'],
        '/root/dist': ['shouldskip.ts'],
        '/root/__pycache__': ['shouldskip.py'],
        '/root/sub': ['file2.js'],
      };
      const dirSet = new Set([
        '/root',
        '/root/node_modules',
        '/root/.hidden',
        '/root/dist',
        '/root/__pycache__',
        '/root/sub',
      ]);

      const fileReader: jest.Mocked<IFileReader> = {
        readFileSync: jest.fn().mockReturnValue('file contents'),
        existsSync: jest.fn(),
        statSync: jest.fn((p: string) => makeStats(dirSet.has(p))),
        readdirSync: jest.fn((p: string) => dirEntries[p] || []),
      };
      const pathResolver = makePathResolver();
      const logger = makeLogger();
      const parser = makeParser();
      parser.parseFile.mockImplementation((filePath: string) => [makeSymbol(`${filePath}:sym`, filePath)]);
      parser.extractImports.mockReturnValue(['./dep']);

      const indexer = new CodeIndexer(parser as unknown as ASTParser, fileReader, pathResolver, logger);

      const index = await indexer.indexRepository('/root');

      // Only file1.ts (root) and sub/file2.js should be indexed; the ignored
      // directories and the non-matching file3.txt must be skipped.
      expect(fileReader.readdirSync).not.toHaveBeenCalledWith('/root/node_modules');
      expect(fileReader.readdirSync).not.toHaveBeenCalledWith('/root/.hidden');
      expect(fileReader.readdirSync).not.toHaveBeenCalledWith('/root/dist');
      expect(fileReader.readdirSync).not.toHaveBeenCalledWith('/root/__pycache__');
      expect(fileReader.readdirSync).toHaveBeenCalledWith('/root/sub');

      expect(index.files.has('/root/file1.ts')).toBe(true);
      expect(index.files.has('/root/sub/file2.js')).toBe(true);
      expect(index.files.has('/root/file3.txt')).toBe(false);
      expect(index.files.size).toBe(2);

      expect(index.symbols.size).toBe(2);
      expect(index.dependencies.nodes.has('/root/file1.ts')).toBe(true);
      expect(index.dependencies.edges).toContainEqual({
        from: '/root/file1.ts',
        to: './dep',
        type: 'imports',
      });

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Indexing repository'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Found 2 files to index'));
    });

    it('logs a warning and continues when parsing a file fails', async () => {
      const fileReader: jest.Mocked<IFileReader> = {
        readFileSync: jest.fn().mockReturnValue('content'),
        existsSync: jest.fn(),
        statSync: jest.fn().mockReturnValue(makeStats(false)),
        readdirSync: jest.fn().mockReturnValue(['broken.ts']),
      };
      // Root itself must report as a directory so walk descends into it.
      fileReader.statSync.mockImplementation((p: string) =>
        makeStats(p === '/root')
      );
      const pathResolver = makePathResolver();
      const logger = makeLogger();
      const parser = makeParser();
      parser.parseFile.mockImplementation(() => {
        throw new Error('parse failure');
      });

      const indexer = new CodeIndexer(parser as unknown as ASTParser, fileReader, pathResolver, logger);

      const index = await indexer.indexRepository('/root');

      expect(index.files.size).toBe(0);
      expect(index.symbols.size).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to index /root/broken.ts')
      );
    });
  });

  describe('updateFile', () => {
    function makeIndex(): CodeIndex {
      return {
        symbols: new Map(),
        files: new Map(),
        dependencies: { nodes: new Set(), edges: [] },
        lastUpdated: new Date('2020-01-01T00:00:00.000Z'),
      };
    }

    it('removes old symbols and re-indexes the file', () => {
      const fileReader: jest.Mocked<IFileReader> = {
        readFileSync: jest.fn().mockReturnValue('new content'),
        existsSync: jest.fn(),
        statSync: jest.fn().mockReturnValue(makeStats(false)),
        readdirSync: jest.fn(),
      };
      const pathResolver = makePathResolver();
      const logger = makeLogger();
      const parser = makeParser();
      parser.parseFile.mockReturnValue([makeSymbol('new-sym', '/root/file.ts')]);

      const indexer = new CodeIndexer(parser as unknown as ASTParser, fileReader, pathResolver, logger);

      const index = makeIndex();
      const oldMetadata: FileMetadata = {
        path: '/root/file.ts',
        language: 'typescript',
        size: 1,
        lastModified: new Date('2019-01-01T00:00:00.000Z'),
        symbols: ['old-sym'],
        imports: [],
        exports: [],
      };
      index.files.set('/root/file.ts', oldMetadata);
      index.symbols.set('old-sym', makeSymbol('old-sym', '/root/file.ts'));

      indexer.updateFile(index, '/root/file.ts');

      expect(index.symbols.has('old-sym')).toBe(false);
      expect(index.symbols.has('new-sym')).toBe(true);
      expect(index.files.get('/root/file.ts')?.symbols).toEqual(['new-sym']);
      expect(index.lastUpdated.getTime()).not.toBe(new Date('2020-01-01T00:00:00.000Z').getTime());
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Updating index for file'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Updated 1 symbols'));
    });

    it('indexes a new file with no prior metadata', () => {
      const fileReader: jest.Mocked<IFileReader> = {
        readFileSync: jest.fn().mockReturnValue('content'),
        existsSync: jest.fn(),
        statSync: jest.fn().mockReturnValue(makeStats(false)),
        readdirSync: jest.fn(),
      };
      const pathResolver = makePathResolver();
      const logger = makeLogger();
      const parser = makeParser();
      parser.parseFile.mockReturnValue([]);

      const indexer = new CodeIndexer(parser as unknown as ASTParser, fileReader, pathResolver, logger);
      const index = makeIndex();

      indexer.updateFile(index, '/root/new-file.ts');

      expect(index.files.has('/root/new-file.ts')).toBe(true);
    });

    it('logs an error when re-indexing fails', () => {
      const fileReader: jest.Mocked<IFileReader> = {
        readFileSync: jest.fn().mockReturnValue('content'),
        existsSync: jest.fn(),
        statSync: jest.fn().mockReturnValue(makeStats(false)),
        readdirSync: jest.fn(),
      };
      const pathResolver = makePathResolver();
      const logger = makeLogger();
      const parser = makeParser();
      parser.parseFile.mockImplementation(() => {
        throw new Error('boom');
      });

      const indexer = new CodeIndexer(parser as unknown as ASTParser, fileReader, pathResolver, logger);
      const index = makeIndex();

      indexer.updateFile(index, '/root/file.ts');

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update /root/file.ts'));
    });
  });
});
