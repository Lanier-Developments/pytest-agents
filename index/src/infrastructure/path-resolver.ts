/**
 * Path resolver implementation
 */

import * as path from 'path';
import { injectable } from 'tsyringe';
import { IPathResolver } from '../interfaces/core';

@injectable()
export class PathResolver implements IPathResolver {
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  dirname(p: string): string {
    return path.dirname(p);
  }

  basename(p: string, ext?: string): string {
    return path.basename(p, ext);
  }

  extname(p: string): string {
    return path.extname(p);
  }
}
