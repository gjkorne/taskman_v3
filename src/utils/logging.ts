/**
 * Centralized logging utility for TaskMan
 * Provides consistent logging with level control and environment awareness
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Configuration object
interface LogConfig {
  minLevel: LogLevel;
  enabled: {
    duration: boolean;
    api: boolean;
    state: boolean;
    component: boolean;
    performance: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: LogConfig = {
  minLevel:
    process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enabled: {
    duration: process.env.NODE_ENV !== 'production',
    api: true,
    state: process.env.NODE_ENV !== 'production',
    component: process.env.NODE_ENV !== 'production',
    performance: true,
  },
};

// Current configuration (can be updated at runtime)
let config: LogConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the logging system
 */
export function configureLogging(newConfig: Partial<LogConfig>): void {
  config = { ...config, ...newConfig };

  if (newConfig.enabled) {
    config.enabled = { ...config.enabled, ...newConfig.enabled };
  }
}

/**
 * Reset logging configuration to defaults
 */
export function resetLoggingConfig(): void {
  config = { ...DEFAULT_CONFIG };
}

/**
 * Debug level logging
 */
export function logDebug(
  category: keyof LogConfig['enabled'],
  message: string,
  ...args: any[]
): void {
  if (shouldLog(LogLevel.DEBUG, category)) {
    console.debug(`[${category.toUpperCase()}] ${message}`, ...args);
  }
}

/**
 * Info level logging
 */
export function logInfo(
  category: keyof LogConfig['enabled'],
  message: string,
  ...args: any[]
): void {
  if (shouldLog(LogLevel.INFO, category)) {
    console.log(`[${category.toUpperCase()}] ${message}`, ...args);
  }
}

/**
 * Warning level logging
 */
export function logWarn(
  category: keyof LogConfig['enabled'],
  message: string,
  ...args: any[]
): void {
  if (shouldLog(LogLevel.WARN, category)) {
    console.warn(`[${category.toUpperCase()}] ${message}`, ...args);
  }
}

/**
 * Error level logging
 */
export function logError(
  category: keyof LogConfig['enabled'],
  message: string,
  ...args: any[]
): void {
  if (shouldLog(LogLevel.ERROR, category)) {
    console.error(`[${category.toUpperCase()}] ${message}`, ...args);
  }
}

/**
 * Determines if a log should be shown based on current config
 */
function shouldLog(
  level: LogLevel,
  category: keyof LogConfig['enabled']
): boolean {
  return level >= config.minLevel && config.enabled[category];
}

/**
 * Performance logging utility - logs execution time of functions
 */
export function logPerformance<T>(
  category: string,
  name: string,
  fn: () => T
): T {
  if (!shouldLog(LogLevel.DEBUG, 'performance')) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  logInfo(
    'performance',
    `${category} - ${name} took ${(end - start).toFixed(2)}ms`
  );
  return result;
}

/**
 * Create a specialized logger for a specific component or module
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, ...args: any[]) =>
      logDebug('component', `[${context}] ${message}`, ...args),
    info: (message: string, ...args: any[]) =>
      logInfo('component', `[${context}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) =>
      logWarn('component', `[${context}] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      logError('component', `[${context}] ${message}`, ...args),
    log: (message: string, ...args: any[]) =>
      logInfo('component', `[${context}] ${message}`, ...args),
    performance: <T>(name: string, fn: () => T): T =>
      logPerformance(context, name, fn),
  };
}
