/**
 * Prometheus metrics implementation
 */

import { injectable } from 'tsyringe';
import { Registry, Counter, Gauge, Histogram } from 'prom-client';
import { IMetrics } from '../interfaces/core';

@injectable()
export class PrometheusMetrics implements IMetrics {
  private registry: Registry;
  private counters: Map<string, Counter>;
  private gauges: Map<string, Gauge>;
  private histograms: Map<string, Histogram>;
  private metricConfigs: Map<string, string[]>;

  constructor() {
    this.registry = new Registry();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.metricConfigs = new Map();

    // Set default labels
    this.registry.setDefaultLabels({
      app: 'pm-agent',
    });

    // Pre-configure metrics with their expected labels
    this.configureMetric('pm_agent_requests_total', ['action']);
    this.configureMetric('pm_agent_requests_success_total', ['action']);
    this.configureMetric('pm_agent_requests_error_total', ['action']);
    this.configureMetric('pm_agent_request_duration_seconds', ['action']);
    this.configureMetric('pm_agent_tasks_total', []);
    this.configureMetric('pm_agent_tasks_by_type', ['type']);
  }

  private configureMetric(name: string, labelNames: string[]): void {
    this.metricConfigs.set(name, labelNames);
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const counter = this.getOrCreateCounter(name, labels);
    if (labels) {
      counter.inc(labels);
    } else {
      counter.inc();
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const gauge = this.getOrCreateGauge(name, labels);
    if (labels) {
      gauge.set(labels, value);
    } else {
      gauge.set(value);
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const histogram = this.getOrCreateHistogram(name, labels);
    if (labels) {
      histogram.observe(labels, value);
    } else {
      histogram.observe(value);
    }
  }

  startTimer(name: string, labels?: Record<string, string>): () => void {
    const histogram = this.getOrCreateHistogram(name, labels);
    return histogram.startTimer(labels);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  private getOrCreateCounter(name: string, _labels?: Record<string, string>): Counter {
    if (!this.counters.has(name)) {
      const labelNames = this.metricConfigs.get(name) || [];
      const counter = new Counter({
        name,
        help: `Counter metric for ${name}`,
        labelNames,
        registers: [this.registry],
      });
      this.counters.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  private getOrCreateGauge(name: string, _labels?: Record<string, string>): Gauge {
    if (!this.gauges.has(name)) {
      const labelNames = this.metricConfigs.get(name) || [];
      const gauge = new Gauge({
        name,
        help: `Gauge metric for ${name}`,
        labelNames,
        registers: [this.registry],
      });
      this.gauges.set(name, gauge);
    }
    return this.gauges.get(name)!;
  }

  private getOrCreateHistogram(name: string, _labels?: Record<string, string>): Histogram {
    if (!this.histograms.has(name)) {
      const labelNames = this.metricConfigs.get(name) || [];
      const histogram = new Histogram({
        name,
        help: `Histogram metric for ${name}`,
        labelNames,
        buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
        registers: [this.registry],
      });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }
}
