/**
 * PM Agent - Core agent implementation
 */

import { AgentRequest, AgentResponse, ProjectState } from './types';
import { TaskTracker } from './capabilities/task-tracking';
import { MilestonePlanner } from './capabilities/milestone-planning';
import { DependencyAnalyzer } from './capabilities/dependency-analysis';
import { ProjectStateManager } from './memory/project-state';
import { logger } from './utils/logger';

export class PMAgent {
  private taskTracker: TaskTracker;
  private milestonePlanner: MilestonePlanner;
  private dependencyAnalyzer: DependencyAnalyzer;
  private stateManager: ProjectStateManager | null;

  constructor(projectPath?: string) {
    this.taskTracker = new TaskTracker();
    this.milestonePlanner = new MilestonePlanner();
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.stateManager = projectPath ? new ProjectStateManager(projectPath) : null;
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    logger.info(`Processing action: ${request.action}`);

    try {
      switch (request.action) {
        case 'ping':
          return this.handlePing();

        case 'track_tasks':
          return await this.handleTrackTasks(request.params);

        case 'get_tasks':
          return this.handleGetTasks(request.params);

        case 'create_milestone':
          return this.handleCreateMilestone(request.params);

        case 'analyze_dependencies':
          return this.handleAnalyzeDependencies();

        case 'save_state':
          return await this.handleSaveState();

        case 'load_state':
          return await this.handleLoadState();

        default:
          return {
            status: 'error',
            data: { error: `Unknown action: ${request.action}` },
          };
      }
    } catch (error) {
      logger.error(`Error processing request: ${error}`);
      return {
        status: 'error',
        data: { error: String(error) },
      };
    }
  }

  private handlePing(): AgentResponse {
    return {
      status: 'success',
      data: { message: 'PM Agent is running', version: '0.1.0' },
    };
  }

  private async handleTrackTasks(params: Record<string, unknown>): Promise<AgentResponse> {
    const projectPath = params.path as string || process.cwd();
    const tasks = await this.taskTracker.trackTasks(projectPath);

    return {
      status: 'success',
      data: {
        tasks: tasks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
        count: tasks.length,
      },
    };
  }

  private handleGetTasks(params: Record<string, unknown>): AgentResponse {
    const type = params.type as string | undefined;
    const tag = params.tag as string | undefined;
    const priority = params.priority as number | undefined;

    let tasks = this.taskTracker.getAllTasks();

    if (type) {
      tasks = this.taskTracker.getTasksByType(type as  'todo' | 'fixme' | 'hack' | 'note');
    } else if (tag) {
      tasks = this.taskTracker.getTasksByTag(tag);
    } else if (priority !== undefined) {
      tasks = this.taskTracker.getTasksByPriority(priority);
    }

    return {
      status: 'success',
      data: {
        tasks: tasks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
        count: tasks.length,
      },
    };
  }

  private handleCreateMilestone(params: Record<string, unknown>): AgentResponse {
    const name = params.name as string;
    const description = params.description as string;
    const taskIds = params.taskIds as string[];
    const dueDate = params.dueDate ? new Date(params.dueDate as string) : undefined;

    const milestone = this.milestonePlanner.createMilestone(name, description, taskIds, dueDate);

    return {
      status: 'success',
      data: {
        milestone: {
          ...milestone,
          dueDate: milestone.dueDate?.toISOString(),
        },
      },
    };
  }

  private handleAnalyzeDependencies(): AgentResponse {
    const tasks = this.taskTracker.getAllTasks();
    const graph = this.dependencyAnalyzer.buildDependencyGraph(tasks);
    const cycles = this.dependencyAnalyzer.detectCycles(graph);
    const order = this.dependencyAnalyzer.getTopologicalOrder(graph);

    return {
      status: 'success',
      data: {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.length,
        cycles: cycles.length,
        cycleDetails: cycles,
        topologicalOrder: order,
      },
    };
  }

  private async handleSaveState(): Promise<AgentResponse> {
    if (!this.stateManager) {
      return {
        status: 'error',
        data: { error: 'No state manager configured' },
      };
    }

    const tasks = this.taskTracker.getAllTasks();
    const graph = this.dependencyAnalyzer.buildDependencyGraph(tasks);

    const state: ProjectState = {
      tasks: new Map(tasks.map((t) => [t.id, t])),
      milestones: this.milestonePlanner.getAllMilestones(),
      dependencies: graph,
      lastUpdated: new Date(),
    };

    await this.stateManager.save(state);

    return {
      status: 'success',
      data: { message: 'State saved successfully' },
    };
  }

  private async handleLoadState(): Promise<AgentResponse> {
    if (!this.stateManager) {
      return {
        status: 'error',
        data: { error: 'No state manager configured' },
      };
    }

    const state = await this.stateManager.load();

    if (!state) {
      return {
        status: 'error',
        data: { error: 'No saved state found' },
      };
    }

    // Restore state
    this.taskTracker.clear();
    for (const task of state.tasks.values()) {
      this.taskTracker.addTask(task);
    }

    return {
      status: 'success',
      data: {
        message: 'State loaded successfully',
        taskCount: state.tasks.size,
        milestoneCount: state.milestones.length,
      },
    };
  }
}
