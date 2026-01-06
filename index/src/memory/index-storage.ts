/**
 * Index storage and persistence
 */

import { injectable, inject } from 'tsyringe';
import { CodeIndex, Symbol, FileMetadata } from '../types';
import { IFileReader, IFileWriter, ILogger, IPathResolver } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class IndexStorage {
  private storageFile: string;

  constructor(
    @inject(TOKENS.IFileReader) private fileReader: IFileReader,
    @inject(TOKENS.IFileWriter) private fileWriter: IFileWriter,
    @inject(TOKENS.IPathResolver) private pathResolver: IPathResolver,
    @inject(TOKENS.ILogger) private logger: ILogger,
    projectPath: string
  ) {
    this.storageFile = this.pathResolver.join(projectPath, '.index-agent-state.json');
  }

  async save(index: CodeIndex): Promise<void> {
    const serialized = {
      symbols: Array.from(index.symbols.entries()),
      files: Array.from(index.files.entries()).map(([path, metadata]) => [
        path,
        {
          ...metadata,
          lastModified: metadata.lastModified.toISOString(),
        },
      ]),
      dependencies: {
        nodes: Array.from(index.dependencies.nodes),
        edges: index.dependencies.edges,
      },
      lastUpdated: index.lastUpdated.toISOString(),
    };

    this.fileWriter.writeFileSync(this.storageFile, JSON.stringify(serialized, null, 2), 'utf-8');
    this.logger.info(`Saved index to ${this.storageFile}`);
  }

  async load(): Promise<CodeIndex | null> {
    if (!this.fileReader.existsSync(this.storageFile)) {
      this.logger.info('No saved index found');
      return null;
    }

    try {
      const content = this.fileReader.readFileSync(this.storageFile, 'utf-8');
      const data = JSON.parse(content);

      const index: CodeIndex = {
        symbols: new Map(
          data.symbols.map(([id, symbol]: [string, Symbol]) => [id, symbol])
        ),
        files: new Map(
          data.files.map(([path, metadata]: [string, any]) => [
            path,
            {
              ...metadata,
              lastModified: new Date(metadata.lastModified),
            } as FileMetadata,
          ])
        ),
        dependencies: {
          nodes: new Set(data.dependencies.nodes),
          edges: data.dependencies.edges,
        },
        lastUpdated: new Date(data.lastUpdated),
      };

      this.logger.info(`Loaded index from ${this.storageFile}`);
      return index;
    } catch (error) {
      this.logger.error(`Error loading index: ${error}`);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (this.fileReader.existsSync(this.storageFile)) {
      this.fileWriter.unlinkSync(this.storageFile);
      this.logger.info('Cleared index storage');
    }
  }

  exists(): boolean {
    return this.fileReader.existsSync(this.storageFile);
  }
}
