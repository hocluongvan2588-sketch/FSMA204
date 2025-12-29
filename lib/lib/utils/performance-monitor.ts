/**
 * Performance Monitoring Utilities
 * Track query performance and identify bottlenecks
 */

interface PerformanceMetric {
  operation: string
  duration_ms: number
  timestamp: Date
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics in memory

  /**
   * Measure execution time of an async function
   */
  async measure<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const startTime = performance.now()
    let success = true
    let error: string | undefined

    try {
      const result = await fn()
      return result
    } catch (e) {
      success = false
      error = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      const duration = performance.now() - startTime

      this.addMetric({
        operation,
        duration_ms: duration,
        timestamp: new Date(),
        success,
        error,
        metadata,
      })

      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`[v0] 🐌 SLOW QUERY: ${operation} took ${duration.toFixed(2)}ms`, metadata)
      }
    }
  }

  /**
   * Add a metric to the history
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string) {
    const filteredMetrics = operation ? this.metrics.filter((m) => m.operation === operation) : this.metrics

    if (filteredMetrics.length === 0) {
      return null
    }

    const durations = filteredMetrics.map((m) => m.duration_ms)
    const successCount = filteredMetrics.filter((m) => m.success).length
    const failureCount = filteredMetrics.length - successCount

    return {
      operation,
      total_calls: filteredMetrics.length,
      success_rate: (successCount / filteredMetrics.length) * 100,
      avg_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
      min_duration_ms: Math.min(...durations),
      max_duration_ms: Math.max(...durations),
      p50_duration_ms: this.percentile(durations, 50),
      p95_duration_ms: this.percentile(durations, 95),
      p99_duration_ms: this.percentile(durations, 99),
      success_count: successCount,
      failure_count: failureCount,
    }
  }

  /**
   * Get all unique operations
   */
  getOperations(): string[] {
    return [...new Set(this.metrics.map((m) => m.operation))]
  }

  /**
   * Get recent slow queries
   */
  getSlowQueries(thresholdMs = 1000, limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.duration_ms > thresholdMs)
      .sort((a, b) => b.duration_ms - a.duration_ms)
      .slice(0, limit)
  }

  /**
   * Calculate percentile
   */
  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (lower === upper) {
      return sorted[lower]
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }

  /**
   * Export metrics as CSV for analysis
   */
  exportCSV(): string {
    const headers = ["timestamp", "operation", "duration_ms", "success", "error", "metadata"]
    const rows = this.metrics.map((m) => [
      m.timestamp.toISOString(),
      m.operation,
      m.duration_ms.toFixed(2),
      m.success,
      m.error || "",
      JSON.stringify(m.metadata || {}),
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Helper decorator for measuring function performance
 */
export function measurePerformance(operation: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(operation, () => originalMethod.apply(this, args), { args: args.length })
    }

    return descriptor
  }
}
