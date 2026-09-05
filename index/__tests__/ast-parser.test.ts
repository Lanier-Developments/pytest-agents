/**
 * Tests for ASTParser
 */

import 'reflect-metadata';

import { ASTParser } from '../src/tools/ast-parser';
import { IFileReader } from '../src/interfaces/core';

function makeFileReader(content: string): jest.Mocked<IFileReader> {
  return {
    readFileSync: jest.fn().mockReturnValue(content),
    existsSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
  };
}

describe('ASTParser', () => {
  describe('parseFile', () => {
    it('extracts function, class, const, variable, interface, and type symbols', () => {
      const content = [
        'function greet(name) {}',
        'class Greeter {}',
        'const GREETING = "hi";',
        'let counter = 0;',
        'interface Person {}',
        'type Name = string;',
      ].join('\n');
      const fileReader = makeFileReader(content);
      const parser = new ASTParser(fileReader);

      const symbols = parser.parseFile('/src/greet.ts');

      const byType = Object.fromEntries(symbols.map((s) => [s.type, s.name]));
      expect(byType.function).toBe('greet');
      expect(byType.class).toBe('Greeter');
      expect(byType.const).toBe('GREETING');
      expect(byType.variable).toBe('counter');
      expect(byType.interface).toBe('Person');
      expect(byType.type).toBe('Name');

      const fnSymbol = symbols.find((s) => s.type === 'function')!;
      expect(fnSymbol.filePath).toBe('/src/greet.ts');
      expect(fnSymbol.line).toBe(1);
      expect(fnSymbol.scope).toBe('module');
      expect(fnSymbol.id).toContain('/src/greet.ts');
      expect(fileReader.readFileSync).toHaveBeenCalledWith('/src/greet.ts', 'utf-8');
    });

    it('parses python-style def as a function symbol', () => {
      const fileReader = makeFileReader('def handler(request):');
      const parser = new ASTParser(fileReader);

      const symbols = parser.parseFile('/src/app.py');

      expect(symbols).toHaveLength(1);
      expect(symbols[0]).toMatchObject({ name: 'handler', type: 'function' });
    });

    it('finds multiple matches per line', () => {
      const fileReader = makeFileReader('const a = 1; const b = 2;');
      const parser = new ASTParser(fileReader);

      const symbols = parser.parseFile('/src/vars.ts');

      expect(symbols.map((s) => s.name)).toEqual(['a', 'b']);
    });

    it('returns no symbols for content with no matches', () => {
      const fileReader = makeFileReader('console.log("nothing to see here");');
      const parser = new ASTParser(fileReader);

      expect(parser.parseFile('/src/empty.ts')).toEqual([]);
    });
  });

  describe('extractImports', () => {
    it('extracts ES6 imports', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const imports = parser.extractImports("import { foo } from './foo';");

      expect(imports).toEqual(['./foo']);
    });

    it('extracts CommonJS requires', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const imports = parser.extractImports("const foo = require('./foo');");

      expect(imports).toEqual(['./foo']);
    });

    it('extracts python-style imports', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const imports = parser.extractImports('from os import path');

      expect(imports).toEqual(['os']);
    });

    it('deduplicates repeated import paths', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const imports = parser.extractImports(
        "import { a } from './shared';\nconst b = require('./shared');"
      );

      expect(imports).toEqual(['./shared']);
    });

    it('returns an empty array when there are no imports', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      expect(parser.extractImports('const x = 1;')).toEqual([]);
    });
  });

  describe('extractExports', () => {
    it('extracts named exports for class/function/const/let/var', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const exports = parser.extractExports('export class Widget {}');

      expect(exports).toEqual(['Widget']);
    });

    it('extracts default exports', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const exports = parser.extractExports('export default function main() {}');

      expect(exports).toEqual(['main']);
    });

    it('extracts module.exports assignments', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const exports = parser.extractExports('module.exports = MyModule;');

      expect(exports).toEqual(['MyModule']);
    });

    it('deduplicates repeated export names', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      const exports = parser.extractExports(
        'export const Thing = 1;\nmodule.exports = Thing;'
      );

      expect(exports).toEqual(['Thing']);
    });

    it('returns an empty array when there are no exports', () => {
      const fileReader = makeFileReader('');
      const parser = new ASTParser(fileReader);

      expect(parser.extractExports('const x = 1;')).toEqual([]);
    });
  });

  describe('detectLanguage', () => {
    const fileReader = makeFileReader('');
    const parser = new ASTParser(fileReader);

    it.each([
      ['/src/file.js', 'javascript'],
      ['/src/file.ts', 'typescript'],
      ['/src/file.py', 'python'],
      ['/src/file.java', 'java'],
      ['/src/file.cpp', 'cpp'],
      ['/src/file.c', 'c'],
      ['/src/file.go', 'go'],
      ['/src/file.rs', 'rust'],
      ['/src/file.rb', 'ruby'],
      ['/src/file.php', 'php'],
    ])('maps %s to %s', (filePath, language) => {
      expect(parser.detectLanguage(filePath)).toBe(language);
    });

    it('is case-insensitive about the extension', () => {
      expect(parser.detectLanguage('/src/FILE.TS')).toBe('typescript');
    });

    it('returns unknown for an unrecognized extension', () => {
      expect(parser.detectLanguage('/src/file.xyz')).toBe('unknown');
    });

    it('returns unknown for a file with no extension', () => {
      expect(parser.detectLanguage('/src/Makefile')).toBe('unknown');
    });

    it('returns unknown for a path ending in a dot', () => {
      expect(parser.detectLanguage('/src/file.')).toBe('unknown');
    });
  });
});
