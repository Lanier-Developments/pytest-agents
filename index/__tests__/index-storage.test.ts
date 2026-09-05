/**
 * Tests for IndexStorage
 */

import 'reflect-metadata';

import { IndexStorage } from '../src/memory/index-storage';
import { IFileReader, IFileWriter, ILogger, IPathResolver } from '../src/interfaces/core';
import { CodeIndex } from '../src/types';

function makeFileReader(): jest.Mocked<IFileReader> {
  return {
    readFileSync: jest.fn(),
    existsSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
  };
}

function makeFileWriter(): jest.Mocked<IFileWriter> {
  return {
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn(),
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

function makeLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function makeIndex(): CodeIndex {
  return {
    symbols: new Map([
      [
        'a',
        {
          id: 'a',
          name: 'foo',
          type: 'function',
          filePath: '/src/a.ts',
          line: 1,
          column: 0,
          scope: 'module',
          references: [],
        },
      ],
    ]),
    files: new Map([
      [
        '/src/a.ts',
        {
          path: '/src/a.ts',
          language: 'typescript',
          size: 10,
          lastModified: new Date('2024-01-01T00:00:00.000Z'),
          symbols: ['a'],
          imports: [],
          exports: [],
        },
      ],
    ]),
    dependencies: {
      nodes: new Set(['/src/a.ts']),
      edges: [{ from: '/src/a.ts', to: '/src/b.ts', type: 'imports' }],
    },
    lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
  };
}

describe('IndexStorage', () => {
  let fileReader: jest.Mocked<IFileReader>;
  let fileWriter: jest.Mocked<IFileWriter>;
  let pathResolver: jest.Mocked<IPathResolver>;
  let logger: jest.Mocked<ILogger>;
  let storage: IndexStorage;

  beforeEach(() => {
    fileReader = makeFileReader();
    fileWriter = makeFileWriter();
    pathResolver = makePathResolver();
    logger = makeLogger();
    storage = new IndexStorage(fileReader, fileWriter, pathResolver, logger, '/project');
  });

  it('derives the storage file path from the project path', () => {
    expect(pathResolver.join).toHaveBeenCalledWith('/project', '.index-agent-state.json');
  });

  it('saves a serialized index to disk', async () => {
    const index = makeIndex();

    await storage.save(index);

    expect(fileWriter.writeFileSync).toHaveBeenCalledTimes(1);
    const [filePath, content, encoding] = fileWriter.writeFileSync.mock.calls[0];
    expect(filePath).toBe('/project/.index-agent-state.json');
    expect(encoding).toBe('utf-8');

    const parsed = JSON.parse(content as string);
    expect(parsed.symbols).toEqual([['a', expect.objectContaining({ name: 'foo' })]]);
    expect(parsed.files[0][1].lastModified).toBe('2024-01-01T00:00:00.000Z');
    expect(parsed.dependencies.nodes).toEqual(['/src/a.ts']);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Saved index'));
  });

  it('returns null and logs when no saved index exists', async () => {
    fileReader.existsSync.mockReturnValue(false);

    const result = await storage.load();

    expect(result).toBeNull();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('No saved index found'));
    expect(fileReader.readFileSync).not.toHaveBeenCalled();
  });

  it('loads and deserializes a previously saved index', async () => {
    const original = makeIndex();
    fileReader.existsSync.mockReturnValue(true);

    let savedContent = '';
    fileWriter.writeFileSync.mockImplementation((_path, content) => {
      savedContent = content as string;
    });
    await storage.save(original);
    fileReader.readFileSync.mockReturnValue(savedContent);

    const loaded = await storage.load();

    expect(loaded).not.toBeNull();
    expect(loaded!.symbols.get('a')).toMatchObject({ name: 'foo' });
    expect(loaded!.files.get('/src/a.ts')?.lastModified).toEqual(
      new Date('2024-01-01T00:00:00.000Z')
    );
    expect(loaded!.dependencies.nodes.has('/src/a.ts')).toBe(true);
    expect(loaded!.lastUpdated).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Loaded index'));
  });

  it('returns null and logs an error when the saved index is corrupt', async () => {
    fileReader.existsSync.mockReturnValue(true);
    fileReader.readFileSync.mockReturnValue('{ not valid json');

    const result = await storage.load();

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading index'));
  });

  it('deletes the storage file when clearing an existing index', async () => {
    fileReader.existsSync.mockReturnValue(true);

    await storage.clear();

    expect(fileWriter.unlinkSync).toHaveBeenCalledWith('/project/.index-agent-state.json');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared index storage'));
  });

  it('does nothing when clearing a non-existent index', async () => {
    fileReader.existsSync.mockReturnValue(false);

    await storage.clear();

    expect(fileWriter.unlinkSync).not.toHaveBeenCalled();
  });

  it('reports whether the storage file exists', () => {
    fileReader.existsSync.mockReturnValue(true);
    expect(storage.exists()).toBe(true);

    fileReader.existsSync.mockReturnValue(false);
    expect(storage.exists()).toBe(false);
  });
});
