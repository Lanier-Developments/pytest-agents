/**
 * Task parser - extracts TODOs, FIXMEs, etc. from code
 */

import { injectable, inject } from 'tsyringe';
import { Task } from '../types';
import { IFileReader, IPathResolver } from '../interfaces/core';
import { TOKENS } from '../di/tokens';

@injectable()
export class TaskParser {
  private readonly patterns = {
    todo: /\/\/\s*TODO:?\s*(.+)/gi,
    fixme: /\/\/\s*FIXME:?\s*(.+)/gi,
    hack: /\/\/\s*HACK:?\s*(.+)/gi,
    note: /\/\/\s*NOTE:?\s*(.+)/gi,
  };

  constructor(
    @inject(TOKENS.IFileReader) private fileReader: IFileReader,
    @inject(TOKENS.IPathResolver) private pathResolver: IPathResolver
  ) {}

  parseFile(filePath: string): Task[] {
    const tasks: Task[] = [];
    const content = this.fileReader.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const [type, pattern] of Object.entries(this.patterns)) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          tasks.push({
            id: `${filePath}:${index + 1}`,
            description: match[1].trim(),
            type: type as Task['type'],
            file: filePath,
            line: index + 1,
            priority: this.calculatePriority(type),
            dependencies: [],
            tags: this.extractTags(match[1]),
            createdAt: new Date(),
          });
        }
      }
    });

    return tasks;
  }

  parseDirectory(dirPath: string, extensions: string[] = ['.ts', '.js', '.py']): Task[] {
    const tasks: Task[] = [];

    const walk = (dir: string): void => {
      const files = this.fileReader.readdirSync(dir);

      for (const file of files) {
        const filePath = this.pathResolver.join(dir, file);
        const stat = this.fileReader.statSync(filePath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
            walk(filePath);
          }
        } else if (extensions.some((ext) => file.endsWith(ext))) {
          try {
            tasks.push(...this.parseFile(filePath));
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };

    walk(dirPath);
    return tasks;
  }

  private calculatePriority(type: string): number {
    const priorities: Record<string, number> = {
      fixme: 3,
      todo: 2,
      hack: 1,
      note: 0,
    };
    return priorities[type] ?? 0;
  }

  private extractTags(text: string): string[] {
    const tagPattern = /#(\w+)/g;
    const matches = text.matchAll(tagPattern);
    return Array.from(matches, (m) => m[1]);
  }
}
