/**
 * PM Agent - Core agent implementation
 */

import { injectable, inject } from 'tsyringe';
import { AgentRequest, AgentResponse, ProjectState } from './types';
import { ITaskTracker, IMilestonePlanner, IDependencyAnalyzer, IProjectStateManager } from './interfaces/capabilities';
import { ILogger, IMetrics } from './interfaces/core';
import { TOKENS } from './di/tokens';

@injectable()
export class PMAgent {
  constructor(
    @inject(TOKENS.ITaskTracker) private taskTracker: ITaskTracker,
    @inject(TOKENS.IMilestonePlanner) private milestonePlanner: IMilestonePlanner,
    @inject(TOKENS.IDependencyAnalyzer) private dependencyAnalyzer: IDependencyAnalyzer,
    @inject(TOKENS.IProjectStateManager) private stateManager: IProjectStateManager,
    @inject(TOKENS.ILogger) private logger: ILogger,
    @inject(TOKENS.IMetrics) private metrics: IMetrics
  ) {}

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    this.logger.info(`Processing action: ${request.action}`);

    // Track total requests
    this.metrics.incrementCounter('pm_agent_requests_total', { action: request.action });

    // Start timer for request duration
    const endTimer = this.metrics.startTimer('pm_agent_request_duration_seconds', { action: request.action });

    try {
      let response: AgentResponse;

      switch (request.action) {
        case 'ping':
          response = this.handlePing();
          break;

        case 'track_tasks':
          response = await this.handleTrackTasks(request.params);
          break;

        case 'get_tasks':
          response = this.handleGetTasks(request.params);
          break;

        case 'create_milestone':
          response = this.handleCreateMilestone(request.params);
          break;

        case 'analyze_dependencies':
          response = this.handleAnalyzeDependencies();
          break;

        case 'save_state':
          response = await this.handleSaveState();
          break;

        case 'load_state':
          response = await this.handleLoadState();
          break;

        case 'get_metrics':
          response = await this.handleGetMetrics();
          break;

        default:
          response = {
            status: 'error',
            data: { error: `Unknown action: ${request.action}` },
          };
      }

      // Track success/error
      if (response.status === 'success') {
        this.metrics.incrementCounter('pm_agent_requests_success_total', { action: request.action });
      } else {
        this.metrics.incrementCounter('pm_agent_requests_error_total', { action: request.action });
      }

      endTimer();
      return response;
    } catch (error) {
      this.logger.error(`Error processing request: ${error}`);
      this.metrics.incrementCounter('pm_agent_requests_error_total', { action: request.action });
      endTimer();
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

    // Track tasks found
    this.metrics.setGauge('pm_agent_tasks_total', tasks.length);

    // Track tasks by type
    const tasksByType = new Map<string, number>();
    tasks.forEach((task) => {
      tasksByType.set(task.type, (tasksByType.get(task.type) || 0) + 1);
    });
    tasksByType.forEach((count, type) => {
      this.metrics.setGauge('pm_agent_tasks_by_type', count, { type });
    });

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

  private async handleGetMetrics(): Promise<AgentResponse> {
    const metrics = await this.metrics.getMetrics();

    return {
      status: 'success',
      data: {
        metrics,
        format: 'prometheus',
      },
    };
  }
}
