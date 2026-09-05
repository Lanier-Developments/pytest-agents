/**
 * Tests for ProjectStateManager
 */

import 'reflect-metadata';

import { ProjectStateManager } from '../src/memory/project-state';
import { IFileReader, IFileWriter, ILogger, IPathResolver } from '../src/interfaces/core';
import { ProjectState, Task } from '../src/types';

const makeLogger = (): jest.Mocked<ILogger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

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

const makeFileWriter = (): jest.Mocked<IFileWriter> => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
});

const makeTask = (id: string): Task => ({
  id,
  description: `task ${id}`,
  type: 'todo',
  file: 'test.ts',
  line: 1,
  priority: 1,
  dependencies: [],
  tags: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('ProjectStateManager', () => {
  let logger: jest.Mocked<ILogger>;
  let pathResolver: jest.Mocked<IPathResolver>;
  let fileReader: jest.Mocked<IFileReader>;
  let fileWriter: jest.Mocked<IFileWriter>;
  let manager: ProjectStateManager;

  beforeEach(() => {
    logger = makeLogger();
    pathResolver = makePathResolver();
    fileReader = makeFileReader();
    fileWriter = makeFileWriter();
    manager = new ProjectStateManager(fileReader, fileWriter, pathResolver, logger, '/project');
  });

  it('builds the state file path from the project path', () => {
    expect(pathResolver.join).toHaveBeenCalledWith('/project', '.pm-agent-state.json');
  });

  describe('save', () => {
    it('serializes and writes the project state', async () => {
      const task = makeTask('t1');
      const state: ProjectState = {
        tasks: new Map([['t1', task]]),
        milestones: [{ id: 'm1', name: 'M1', description: 'd', tasks: ['t1'], completed: false }],
        dependencies: {
          nodes: new Map([['t1', task]]),
          edges: [{ from: 't1', to: 't2', type: 'blocks' }],
        },
        lastUpdated: new Date('2026-01-02T00:00:00.000Z'),
      };

      await manager.save(state);

      expect(fileWriter.writeFileSync).toHaveBeenCalledTimes(1);
      const [filePath, content, encoding] = fileWriter.writeFileSync.mock.calls[0];
      expect(filePath).toBe('/project/.pm-agent-state.json');
      expect(encoding).toBe('utf-8');

      const parsed = JSON.parse(content as string);
      expect(parsed.tasks).toEqual([['t1', { ...task, createdAt: task.createdAt.toISOString() }]]);
      expect(parsed.milestones).toEqual(state.milestones);
      expect(parsed.dependencies.edges).toEqual(state.dependencies.edges);
      expect(parsed.lastUpdated).toBe('2026-01-02T00:00:00.000Z');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Saved project state to')
      );
    });
  });

  describe('load', () => {
    it('returns null and logs when no state file exists', async () => {
      fileReader.existsSync.mockReturnValue(false);

      const result = await manager.load();

      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith('No saved state found');
      expect(fileReader.readFileSync).not.toHaveBeenCalled();
    });

    it('parses and reconstructs saved state', async () => {
      fileReader.existsSync.mockReturnValue(true);
      const serialized = {
        tasks: [['t1', { ...makeTask('t1'), createdAt: '2026-01-01T00:00:00.000Z' }]],
        milestones: [
          { id: 'm1', name: 'M1', description: 'd', tasks: ['t1'], completed: false, dueDate: '2026-02-01T00:00:00.000Z' },
          { id: 'm2', name: 'M2', description: 'd', tasks: [], completed: true },
        ],
        dependencies: {
          nodes: [['t1', { ...makeTask('t1'), createdAt: '2026-01-01T00:00:00.000Z' }]],
          edges: [{ from: 't1', to: 't2', type: 'blocks' }],
        },
        lastUpdated: '2026-01-03T00:00:00.000Z',
      };
      fileReader.readFileSync.mockReturnValue(JSON.stringify(serialized));

      const result = await manager.load();

      expect(result).not.toBeNull();
      expect(result?.tasks.get('t1')?.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
      expect(result?.milestones[0].dueDate).toEqual(new Date('2026-02-01T00:00:00.000Z'));
      expect(result?.milestones[1].dueDate).toBeUndefined();
      expect(result?.dependencies.nodes.get('t1')?.id).toBe('t1');
      expect(result?.dependencies.edges).toEqual(serialized.dependencies.edges);
      expect(result?.lastUpdated).toEqual(new Date('2026-01-03T00:00:00.000Z'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Loaded project state from')
      );
    });

    it('returns null and logs an error when the file content is invalid JSON', async () => {
      fileReader.existsSync.mockReturnValue(true);
      fileReader.readFileSync.mockReturnValue('not valid json');

      const result = await manager.load();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading state'));
    });
  });

  describe('clear', () => {
    it('deletes the state file when it exists', async () => {
      fileReader.existsSync.mockReturnValue(true);

      await manager.clear();

      expect(fileWriter.unlinkSync).toHaveBeenCalledWith('/project/.pm-agent-state.json');
      expect(logger.info).toHaveBeenCalledWith('Cleared project state');
    });

    it('does nothing when the state file does not exist', async () => {
      fileReader.existsSync.mockReturnValue(false);

      await manager.clear();

      expect(fileWriter.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
