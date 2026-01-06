/**
 * Code indexing capability
 */

import { injectable, inject } from 'tsyringe';
import { FileMetadata, CodeIndex } from '../types';
import { ASTParser } from '../tools/ast-parser';
import { IFileReader, ILogger, IPathResolver } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class CodeIndexer {
  constructor(
    @inject(TOKENS.IASTParser) private parser: ASTParser,
    @inject(TOKENS.IFileReader) private fileReader: IFileReader,
    @inject(TOKENS.IPathResolver) private pathResolver: IPathResolver,
    @inject(TOKENS.ILogger) private logger: ILogger
  ) {}

  async indexRepository(rootPath: string): Promise<CodeIndex> {
    this.logger.info(`Indexing repository: ${rootPath}`);

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
    this.logger.info(`Found ${files.length} files to index`);

    for (const filePath of files) {
      try {
        const symbols = this.parser.parseFile(filePath);
        const content = this.fileReader.readFileSync(filePath, 'utf-8');
        const stats = this.fileReader.statSync(filePath);

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
        this.logger.warn(`Failed to index ${filePath}: ${error}`);
      }
    }

    this.logger.info(
      `Indexed ${index.symbols.size} symbols across ${index.files.size} files`
    );
    return index;
  }

  private walkDirectory(dir: string, extensions: string[] = ['.ts', '.js', '.py']): string[] {
    const files: string[] = [];

    const walk = (currentPath: string): void => {
      const entries = this.fileReader.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = this.pathResolver.join(currentPath, entry);
        const stat = this.fileReader.statSync(fullPath);

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
    this.logger.info(`Updating index for file: ${filePath}`);

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
      const content = this.fileReader.readFileSync(filePath, 'utf-8');
      const stats = this.fileReader.statSync(filePath);

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

      this.logger.info(`Updated ${symbols.length} symbols for ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to update ${filePath}: ${error}`);
    }
  }
}
