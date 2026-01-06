/**
 * Core infrastructure interfaces for dependency injection
 */

export interface IFileStats {
  isDirectory(): boolean;
  isFile(): boolean;
  size: number;
  mtime: Date;
}

/**
 * File system read operations abstraction
 */
export interface IFileReader {
  readFileSync(path: string, encoding?: string): string;
  existsSync(path: string): boolean;
  statSync(path: string): IFileStats;
  readdirSync(path: string): string[];
}

/**
 * File system write operations abstraction
 */
export interface IFileWriter {
  writeFileSync(path: string, content: string, encoding?: string): void;
  unlinkSync(path: string): void;
}

/**
 * Path operations abstraction
 */
export interface IPathResolver {
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  extname(path: string): string;
}

/**
 * Logging abstraction
 */
export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Storage/Persistence abstraction
 */
export interface IStorage<T> {
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  exists(key: string): Promise<boolean>;
  clear(key: string): Promise<void>;
}

/**
 * Metrics collection abstraction
 */
export interface IMetrics {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void;
  startTimer(name: string, labels?: Record<string, string>): () => void;
  getMetrics(): Promise<string>;
}
