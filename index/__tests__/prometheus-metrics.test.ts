/**
 * Tests for PrometheusMetrics
 */

import 'reflect-metadata';

import { PrometheusMetrics } from '../src/infrastructure/prometheus-metrics';

describe('PrometheusMetrics', () => {
  let metrics: PrometheusMetrics;

  beforeEach(() => {
    metrics = new PrometheusMetrics();
  });

  it('increments a pre-configured counter without labels', async () => {
    metrics.incrementCounter('index_agent_files_indexed_total');
    const output = await metrics.getMetrics();
    expect(output).toMatch(/index_agent_files_indexed_total\{[^}]*\} 1/);
  });

  it('increments a pre-configured counter with labels', async () => {
    metrics.incrementCounter('index_agent_requests_total', { action: 'create' });
    const output = await metrics.getMetrics();
    expect(output).toMatch(/index_agent_requests_total\{[^}]*action="create"[^}]*\} 1/);
  });

  it('increments a counter that was not pre-configured', async () => {
    metrics.incrementCounter('ad_hoc_counter');
    const output = await metrics.getMetrics();
    expect(output).toMatch(/ad_hoc_counter\{[^}]*\} 1/);
  });

  it('reuses an existing counter instance across calls', async () => {
    metrics.incrementCounter('index_agent_files_indexed_total');
    metrics.incrementCounter('index_agent_files_indexed_total');
    const output = await metrics.getMetrics();
    expect(output).toMatch(/index_agent_files_indexed_total\{[^}]*\} 2/);
  });

  it('sets a gauge value without labels', async () => {
    metrics.setGauge('active_tasks', 5);
    const output = await metrics.getMetrics();
    expect(output).toMatch(/active_tasks\{[^}]*\} 5/);
  });

  it('sets a gauge value with labels', async () => {
    metrics.setGauge('index_agent_symbols_by_type', 3, { type: 'function' });
    const output = await metrics.getMetrics();
    expect(output).toMatch(/index_agent_symbols_by_type\{[^}]*type="function"[^}]*\} 3/);
  });

  it('observes a histogram value without labels', async () => {
    metrics.observeHistogram('op_duration', 0.25);
    const output = await metrics.getMetrics();
    expect(output).toMatch(/op_duration_sum\{[^}]*\} 0\.25/);
  });

  it('observes a histogram value with labels', async () => {
    metrics.observeHistogram('index_agent_request_duration_seconds', 0.5, { action: 'create' });
    const output = await metrics.getMetrics();
    expect(output).toMatch(
      /index_agent_request_duration_seconds_sum\{[^}]*action="create"[^}]*\} 0\.5/
    );
  });

  it('starts a timer that records a duration when stopped', async () => {
    const stop = metrics.startTimer('timed_operation');
    expect(typeof stop).toBe('function');
    stop();

    const output = await metrics.getMetrics();
    expect(output).toMatch(/timed_operation_count\{[^}]*\} 1/);
  });

  it('starts a timer with labels', async () => {
    const stop = metrics.startTimer('index_agent_request_duration_seconds', { action: 'update' });
    stop();

    const output = await metrics.getMetrics();
    expect(output).toMatch(
      /index_agent_request_duration_seconds_count\{[^}]*action="update"[^}]*\} 1/
    );
  });

  it('includes the app default label in exported metrics', async () => {
    metrics.incrementCounter('index_agent_files_indexed_total');
    const output = await metrics.getMetrics();
    expect(output).toContain('app="index-agent"');
  });

  it('exports metrics in Prometheus text format', async () => {
    metrics.incrementCounter('index_agent_files_indexed_total');
    const output = await metrics.getMetrics();
    expect(output).toEqual(expect.any(String));
    expect(output.length).toBeGreaterThan(0);
  });
});
