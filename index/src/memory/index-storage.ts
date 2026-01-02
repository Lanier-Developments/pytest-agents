/**
 * Index storage and persistence
 */

import * as fs from 'fs';
import * as path from 'path';
import { CodeIndex, Symbol, FileMetadata } from '../types';
import { logger } from '../utils/logger';

export class IndexStorage {
  private storageFile: string;

  constructor(projectPath: string) {
    this.storageFile = path.join(projectPath, '.index-agent-state.json');
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

    fs.writeFileSync(this.storageFile, JSON.stringify(serialized, null, 2), 'utf-8');
    logger.info(`Saved index to ${this.storageFile}`);
  }

  async load(): Promise<CodeIndex | null> {
    if (!fs.existsSync(this.storageFile)) {
      logger.info('No saved index found');
      return null;
    }

    try {
      const content = fs.readFileSync(this.storageFile, 'utf-8');
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

      logger.info(`Loaded index from ${this.storageFile}`);
      return index;
    } catch (error) {
      logger.error(`Error loading index: ${error}`);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (fs.existsSync(this.storageFile)) {
      fs.unlinkSync(this.storageFile);
      logger.info('Cleared index storage');
    }
  }

  exists(): boolean {
    return fs.existsSync(this.storageFile);
  }
}
