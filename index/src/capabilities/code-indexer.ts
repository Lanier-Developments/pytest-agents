/**
 * Code indexing capability
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileMetadata, CodeIndex } from '../types';
import { ASTParser } from '../tools/ast-parser';
import { logger } from '../utils/logger';

export class CodeIndexer {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  async indexRepository(rootPath: string): Promise<CodeIndex> {
    logger.info(`Indexing repository: ${rootPath}`);

    const index: CodeIndex = {
      symbols: new Map(),
      files: new Map(),
      dependencies: {
        nodes: new Set(),
        edges: [],
      },
      lastUpdated: new Date(),
    };

    const files = this.walkDirectory(rootPath);
    logger.info(`Found ${files.length} files to index`);

    for (const filePath of files) {
      try {
        const symbols = this.parser.parseFile(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);

        // Add symbols to index
        for (const symbol of symbols) {
          index.symbols.set(symbol.id, symbol);
        }

        // Add file metadata
        const metadata: FileMetadata = {
          path: filePath,
          language: this.parser.detectLanguage(filePath),
          size: stats.size,
          lastModified: stats.mtime,
          symbols: symbols.map((s) => s.id),
          imports: this.parser.extractImports(content),
          exports: this.parser.extractExports(content),
        };

        index.files.set(filePath, metadata);
        index.dependencies.nodes.add(filePath);

        // Build dependency edges
        for (const importPath of metadata.imports) {
          index.dependencies.edges.push({
            from: filePath,
            to: importPath,
            type: 'imports',
          });
        }
      } catch (error) {
        logger.warn(`Failed to index ${filePath}: ${error}`);
      }
    }

    logger.info(
      `Indexed ${index.symbols.size} symbols across ${index.files.size} files`
    );
    return index;
  }

  private walkDirectory(dir: string, extensions: string[] = ['.ts', '.js', '.py']): string[] {
    const files: string[] = [];

    const walk = (currentPath: string): void => {
      const entries = fs.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip common ignore directories
          if (
            !entry.startsWith('.') &&
            entry !== 'node_modules' &&
            entry !== 'dist' &&
            entry !== '__pycache__'
          ) {
            walk(fullPath);
          }
        } else if (extensions.some((ext) => entry.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  updateFile(index: CodeIndex, filePath: string): void {
    logger.info(`Updating index for file: ${filePath}`);

    // Remove old symbols
    const oldMetadata = index.files.get(filePath);
    if (oldMetadata) {
      for (const symbolId of oldMetadata.symbols) {
        index.symbols.delete(symbolId);
      }
    }

    // Re-index file
    try {
      const symbols = this.parser.parseFile(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);

      for (const symbol of symbols) {
        index.symbols.set(symbol.id, symbol);
      }

      const metadata: FileMetadata = {
        path: filePath,
        language: this.parser.detectLanguage(filePath),
        size: stats.size,
        lastModified: stats.mtime,
        symbols: symbols.map((s) => s.id),
        imports: this.parser.extractImports(content),
        exports: this.parser.extractExports(content),
      };

      index.files.set(filePath, metadata);
      index.lastUpdated = new Date();

      logger.info(`Updated ${symbols.length} symbols for ${filePath}`);
    } catch (error) {
      logger.error(`Failed to update ${filePath}: ${error}`);
    }
  }
}
