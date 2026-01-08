# TypeScript API Reference

Complete reference for pytest-agents's TypeScript agent APIs.

## Table of Contents

- [Common Interfaces](#common-interfaces)
- [PM Agent](#pm-agent)
- [Research Agent](#research-agent)
- [Index Agent](#index-agent)
- [Creating Custom Agents](#creating-custom-agents)

## Common Interfaces

All agents share common interfaces for consistency.

### `AgentRequest`

Standard request format received from Python via stdin.

```typescript
interface AgentRequest {
  action: string;
  params: Record<string, unknown>;
}
```

**Example**:
```json
{
  "action": "list_tasks",
  "params": {
    "path": "./src",
    "filter": "pending"
  }
}
```

### `AgentResponse`

Standard response format sent to Python via stdout.

```typescript
interface AgentResponse {
  status: 'success' | 'error';
  data: Record<string, unknown>;
  agent?: string;  // Set by Python bridge
}
```

**Example Success**:
```json
{
  "status": "success",
  "data": {
    "tasks": [
      {"id": 1, "name": "Task 1", "status": "pending"}
    ]
  }
}
```

**Example Error**:
```json
{
  "status": "error",
  "data": {
    "error": "Invalid path provided",
    "code": "INVALID_PATH"
  }
}
```

### Base Agent Pattern

All agents follow this pattern:

```typescript
export class BaseAgent {
  async handle(action: string, params: any): Promise<AgentResponse> {
    try {
      switch (action) {
        case 'ping':
          return this.ping();
        case 'action_name':
          return this.actionName(params);
        default:
          return {
            status: 'error',
            data: { error: `Unknown action: ${action}` }
          };
      }
    } catch (error) {
      return {
        status: 'error',
        data: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  protected ping(): AgentResponse {
    return {
      status: 'success',
      data: { message: 'pong' }
    };
  }
}
```

## PM Agent

Project Management agent for task tracking and planning.

**Location**: `pm/src/`

### Types

```typescript
// pm/src/types.ts

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  assignee?: string;
  created: Date;
  updated: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  dueDate?: Date;
  completed: boolean;
}

export interface ProjectState {
  tasks: Task[];
  milestones: Milestone[];
  metadata: Record<string, unknown>;
}
```

### PMAgent Class

```typescript
// pm/src/agent.ts

export class PMAgent {
  constructor(private state: ProjectState = { tasks: [], milestones: [], metadata: {} }) {}

  async handle(action: string, params: any): Promise<AgentResponse> {
    // Implementation
  }

  // Actions
  async listTasks(params: ListTasksParams): Promise<AgentResponse>;
  async createTask(params: CreateTaskParams): Promise<AgentResponse>;
  async updateTask(params: UpdateTaskParams): Promise<AgentResponse>;
  async deleteTask(params: DeleteTaskParams): Promise<AgentResponse>;
  async analyzeDependencies(params: AnalyzeDepsParams): Promise<AgentResponse>;
  async planMilestone(params: PlanMilestoneParams): Promise<AgentResponse>;
}
```

### Actions

#### `ping`

Health check action.

**Parameters**: None

**Returns**:
```typescript
{
  status: 'success',
  data: { message: 'pong' }
}
```

#### `list_tasks`

List tasks with optional filtering.

**Parameters**:
```typescript
{
  filter?: {
    status?: 'pending' | 'in_progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    assignee?: string;
  };
  sort?: 'created' | 'updated' | 'priority';
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    tasks: Task[];
    count: number;
  }
}
```

#### `create_task`

Create a new task.

**Parameters**:
```typescript
{
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dependencies?: string[];
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    task: Task;
  }
}
```

#### `analyze_dependencies`

Analyze task dependencies.

**Parameters**:
```typescript
{
  taskId?: string;  // Specific task, or all if omitted
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    graph: {
      nodes: { id: string; title: string }[];
      edges: { from: string; to: string }[];
    };
    cycles: string[][];  // Circular dependencies
    criticalPath: string[];
  }
}
```

### Capabilities

Located in `pm/src/capabilities/`:

#### TaskTracking

```typescript
// pm/src/capabilities/task-tracking.ts

export class TaskTracking {
  track(tasks: Task[]): TaskMetrics;
  prioritize(tasks: Task[]): Task[];
  filter(tasks: Task[], criteria: FilterCriteria): Task[];
}
```

#### DependencyAnalysis

```typescript
// pm/src/capabilities/dependency-analysis.ts

export class DependencyAnalysis {
  buildGraph(tasks: Task[]): DependencyGraph;
  findCycles(graph: DependencyGraph): string[][];
  findCriticalPath(graph: DependencyGraph): string[];
}
```

#### MilestonePlanning

```typescript
// pm/src/capabilities/milestone-planning.ts

export class MilestonePlanning {
  plan(tasks: Task[], goal: string): Milestone;
  estimate(milestone: Milestone): { duration: number; resources: string[] };
  track(milestone: Milestone): MilestoneProgress;
}
```

## Research Agent

AI-powered research and documentation analysis.

**Location**: `research/src/`

### Types

```typescript
// research/src/types.ts

export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata: Record<string, unknown>;
  analyzed: boolean;
}

export interface Citation {
  documentId: string;
  text: string;
  context: string;
  relevance: number;
}

export interface ResearchResult {
  query: string;
  documents: Document[];
  citations: Citation[];
  summary: string;
}
```

### ResearchAgent Class

```typescript
// research/src/agent.ts

export class ResearchAgent {
  async handle(action: string, params: any): Promise<AgentResponse> {
    // Implementation
  }

  // Actions
  async analyzeDocument(params: AnalyzeDocParams): Promise<AgentResponse>;
  async search(params: SearchParams): Promise<AgentResponse>;
  async summarize(params: SummarizeParams): Promise<AgentResponse>;
  async extractCitations(params: CitationParams): Promise<AgentResponse>;
}
```

### Actions

#### `analyze_document`

Analyze a document.

**Parameters**:
```typescript
{
  content: string;
  title?: string;
  url?: string;
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    document: Document;
    analysis: {
      topics: string[];
      entities: { name: string; type: string }[];
      sentiment: 'positive' | 'neutral' | 'negative';
      readability: number;
    };
  }
}
```

#### `search`

Search documents.

**Parameters**:
```typescript
{
  query: string;
  filters?: {
    analyzed?: boolean;
    minRelevance?: number;
  };
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    results: Document[];
    count: number;
  }
}
```

#### `summarize`

Summarize documents.

**Parameters**:
```typescript
{
  documentIds: string[];
  maxLength?: number;
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    summary: string;
    keyPoints: string[];
  }
}
```

### Capabilities

Located in `research/src/capabilities/`:

#### DocumentAnalysis

```typescript
// research/src/capabilities/document-analysis.ts

export class DocumentAnalysis {
  analyze(content: string): DocumentAnalysisResult;
  extractTopics(content: string): string[];
  extractEntities(content: string): Entity[];
}
```

#### CitationTracker

```typescript
// research/src/capabilities/citation-tracker.ts

export class CitationTracker {
  track(document: Document): Citation[];
  validate(citation: Citation): boolean;
  format(citation: Citation, style: 'APA' | 'MLA' | 'Chicago'): string;
}
```

## Index Agent

Code indexing and intelligent search.

**Location**: `index/src/`

### Types

```typescript
// index/src/types.ts

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type';
  file: string;
  line: number;
  column: number;
  signature?: string;
  documentation?: string;
}

export interface SearchResult {
  symbol: CodeSymbol;
  score: number;
  context: string[];
}

export interface IndexStats {
  totalFiles: number;
  totalSymbols: number;
  languages: Record<string, number>;
  lastIndexed: Date;
}
```

### IndexAgent Class

```typescript
// index/src/agent.ts

export class IndexAgent {
  async handle(action: string, params: any): Promise<AgentResponse> {
    // Implementation
  }

  // Actions
  async indexProject(params: IndexParams): Promise<AgentResponse>;
  async search(params: SearchParams): Promise<AgentResponse>;
  async findSymbol(params: FindSymbolParams): Promise<AgentResponse>;
  async getStats(params: StatsParams): Promise<AgentResponse>;
}
```

### Actions

#### `index_project`

Index a project directory.

**Parameters**:
```typescript
{
  path: string;
  include?: string[];  // Glob patterns
  exclude?: string[];  // Glob patterns
  languages?: string[];  // ['typescript', 'python', etc.]
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    stats: IndexStats;
    duration: number;
  }
}
```

#### `search`

Search indexed code.

**Parameters**:
```typescript
{
  query: string;
  kind?: 'function' | 'class' | 'variable' | 'interface' | 'type';
  file?: string;  // Filter by file path
  limit?: number;
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    results: SearchResult[];
    count: number;
  }
}
```

#### `find_symbol`

Find a specific symbol.

**Parameters**:
```typescript
{
  name: string;
  kind?: string;
}
```

**Returns**:
```typescript
{
  status: 'success',
  data: {
    symbol: CodeSymbol | null;
  }
}
```

### Capabilities

Located in `index/src/capabilities/`:

#### CodeIndexer

```typescript
// index/src/capabilities/code-indexer.ts

export class CodeIndexer {
  index(path: string): IndexResult;
  update(file: string): void;
  remove(file: string): void;
}
```

#### SymbolMapper

```typescript
// index/src/capabilities/symbol-mapper.ts

export class SymbolMapper {
  map(ast: AST): CodeSymbol[];
  resolve(symbolName: string): CodeSymbol | null;
  findReferences(symbol: CodeSymbol): Reference[];
}
```

## Creating Custom Agents

### Step 1: Project Structure

```
my-agent/
├── src/
│   ├── index.ts          # Entry point
│   ├── agent.ts          # Main agent class
│   ├── types.ts          # Type definitions
│   ├── capabilities/     # Agent capabilities
│   ├── tools/            # Helper tools
│   └── utils/            # Utilities
├── __tests__/            # Jest tests
├── package.json
└── tsconfig.json
```

### Step 2: Implement Entry Point

```typescript
// src/index.ts
import { MyAgent } from './agent';

async function main() {
  const agent = new MyAgent();

  // Read request from stdin
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const request = JSON.parse(input);
    const response = await agent.handle(request.action, request.params);
    console.log(JSON.stringify(response));
    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({
      status: 'error',
      data: {
        error: error instanceof Error ? error.message : String(error)
      }
    }));
    process.exit(1);
  }
}

main();
```

### Step 3: Implement Agent Class

```typescript
// src/agent.ts
import { AgentResponse } from './types';

export class MyAgent {
  async handle(action: string, params: any): Promise<AgentResponse> {
    try {
      switch (action) {
        case 'ping':
          return this.ping();
        case 'my_action':
          return this.myAction(params);
        default:
          return {
            status: 'error',
            data: { error: `Unknown action: ${action}` }
          };
      }
    } catch (error) {
      return {
        status: 'error',
        data: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  protected ping(): AgentResponse {
    return {
      status: 'success',
      data: { message: 'pong' }
    };
  }

  private async myAction(params: any): Promise<AgentResponse> {
    // Implement your action
    return {
      status: 'success',
      data: { result: 'action completed' }
    };
  }
}
```

### Step 4: Define Types

```typescript
// src/types.ts

export interface AgentRequest {
  action: string;
  params: Record<string, unknown>;
}

export interface AgentResponse {
  status: 'success' | 'error';
  data: Record<string, unknown>;
}

export interface MyActionParams {
  // Define your parameter types
  input: string;
  options?: {
    flag: boolean;
  };
}
```

### Step 5: Add Tests

```typescript
// __tests__/agent.test.ts
import { MyAgent } from '../src/agent';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  it('should respond to ping', async () => {
    const response = await agent.handle('ping', {});
    expect(response.status).toBe('success');
    expect(response.data.message).toBe('pong');
  });

  it('should handle my_action', async () => {
    const response = await agent.handle('my_action', { input: 'test' });
    expect(response.status).toBe('success');
  });

  it('should handle unknown action', async () => {
    const response = await agent.handle('unknown', {});
    expect(response.status).toBe('error');
  });
});
```

### Step 6: Configure Build

```json
// package.json
{
  "name": "my-agent",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node src/index.ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "__tests__"]
}
```

### Step 7: Register with Python

```python
# In pytest-agents/config.py
agent_myagent_enabled: bool = True
agent_myagent_path: Optional[Path] = None

# In pytest-agents/agent_bridge.py
if self.config.agent_myagent_enabled and self.config.agent_myagent_path:
    self.agents["myagent"] = AgentClient(
        "myagent",
        self.config.agent_myagent_path,
        self.config.agent_timeout
    )
```

## Best Practices

1. **Always handle errors**: Wrap logic in try-catch
2. **Validate input**: Check params before using
3. **Return consistent responses**: Always use AgentResponse format
4. **Log appropriately**: Use console.error for errors, not console.log
5. **Type everything**: Use TypeScript strict mode
6. **Test thoroughly**: Unit tests for all actions
7. **Document actions**: Add JSDoc comments
8. **Keep it simple**: One responsibility per action

## Next Steps

- Review [Python API Reference](python-api.md)
- Study [Architecture Overview](../developer-guide/architecture.md)
- Read [Developer Guide](../developer-guide/README.md)
