/**
 * Simple AST parsing for code analysis
 */

import { injectable, inject } from 'tsyringe';
import { Symbol } from '../types';
import { IFileReader } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class ASTParser {
  constructor(@inject(TOKENS.IFileReader) private fileReader: IFileReader) {}

  parseFile(filePath: string): Symbol[] {
    const symbols: Symbol[] = [];
    const content = this.fileReader.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple pattern-based parsing (works for JS/TS/Python)
    const patterns = {
      function: /(?:function|def)\s+(\w+)\s*\(/g,
      class: /class\s+(\w+)/g,
      const: /const\s+(\w+)\s*=/g,
      variable: /(?:let|var)\s+(\w+)\s*=/g,
      interface: /interface\s+(\w+)/g,
      type: /type\s+(\w+)\s*=/g,
    };

    lines.forEach((line, lineIndex) => {
      for (const [type, pattern] of Object.entries(patterns)) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const name = match[1];
          const column = match.index || 0;

          symbols.push({
            id: `${filePath}:${lineIndex}:${column}:${name}`,
            name,
            type: type as Symbol['type'],
            filePath,
            line: lineIndex + 1,
            column,
            scope: 'module',
            signature: line.trim(),
            references: [],
          });
        }
      }
    });

    return symbols;
  }

  extractImports(content: string): string[] {
    const imports: string[] = [];
    const importPatterns = [
      /import\s+.*?\s+from\s+['"](.+?)['"]/g, // ES6 imports
      /require\(['"](.+?)['"]\)/g, // CommonJS
      /from\s+(\S+)\s+import/g, // Python
    ];

    for (const pattern of importPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      /module\.exports\s*=\s*(\w+)/g,
    ];

    for (const pattern of exportPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        exports.push(match[1]);
      }
    }

    return [...new Set(exports)];
  }

  detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
    };

    return languageMap[ext] || 'unknown';
  }
}
