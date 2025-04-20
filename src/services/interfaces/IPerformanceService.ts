import { IService } from './IService';

/**
 * Performance metric types
 */
export enum MetricType {
  TIMING = 'timing',
  COUNTER = 'counter',
  GAUGE = 'gauge',
}

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

/**
 * Events that can be emitted by the PerformanceService
 */
export interface PerformanceServiceEvents {
  'metric-recorded': PerformanceMetric;
  'report-generated': {
    metrics: PerformanceMetric[];
    summary: Record<string, any>;
  };
  'threshold-exceeded': {
    metric: PerformanceMetric;
    threshold: number;
    critical: boolean;
  };
  error: Error;
}

/**
 * Interface for the PerformanceService
 * Provides methods to track and analyze application performance
 */
export interface IPerformanceService
  extends IService<PerformanceServiceEvents> {
  /**
   * Start timing an operation
   * @param name Name of the operation to time
   * @param tags Additional tags to categorize the metric
   * @returns Unique ID for the timing operation
   */
  startTimer(name: string, tags?: Record<string, string>): string;

  /**
   * Stop timing an operation and record the duration
   * @param timerId ID of the timer to stop
   * @returns Duration in milliseconds
   */
  stopTimer(timerId: string): number;

  /**
   * Record a timing metric directly
   * @param name Name of the timing metric
   * @param durationMs Duration in milliseconds
   * @param tags Additional tags to categorize the metric
   */
  recordTiming(
    name: string,
    durationMs: number,
    tags?: Record<string, string>
  ): void;

  /**
   * Increment a counter metric
   * @param name Name of the counter
   * @param value Value to increment by (default: 1)
   * @param tags Additional tags to categorize the metric
   */
  incrementCounter(
    name: string,
    value?: number,
    tags?: Record<string, string>
  ): void;

  /**
   * Set a gauge metric to a specific value
   * @param name Name of the gauge
   * @param value Current value
   * @param tags Additional tags to categorize the metric
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * Get metrics by name
   * @param name Name of the metrics to retrieve
   * @returns Array of matching metrics
   */
  getMetrics(name: string): PerformanceMetric[];

  /**
   * Get all recorded metrics
   * @returns All recorded metrics
   */
  getAllMetrics(): PerformanceMetric[];

  /**
   * Generate a performance report
   * @param options Options for the report
   * @returns Performance report data
   */
  generateReport(options?: {
    startTime?: number;
    endTime?: number;
    metricNames?: string[];
    includeTags?: Record<string, string>;
  }): {
    metrics: PerformanceMetric[];
    summary: {
      totalMetrics: number;
      averages: Record<string, number>;
      min: Record<string, number>;
      max: Record<string, number>;
      p95: Record<string, number>;
    };
  };

  /**
   * Set a performance threshold to monitor
   * @param metricName Name of the metric to monitor
   * @param threshold Threshold value
   * @param options Additional options
   */
  setThreshold(
    metricName: string,
    threshold: number,
    options?: {
      critical?: boolean;
      tags?: Record<string, string>;
      callback?: (metric: PerformanceMetric, threshold: number) => void;
    }
  ): void;

  /**
   * Remove a previously set threshold
   * @param metricName Name of the metric
   */
  removeThreshold(metricName: string): void;

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void;

  /**
   * Get a summary of application performance
   */
  getPerformanceSummary(): Record<string, any>;
}
