import type { AAQueryConfig, ReportConfig } from '@dua-upd/types-common';
import { createHash } from 'crypto';

/**
 * Normalize a ReportConfig to ensure consistent hashing
 * @param config The object to normalize
 */
export function normalizeConfig(config: ReportConfig): ReportConfig {
  const breakdownDimension = config.breakdownDimension
    ? { breakdownDimension: config.breakdownDimension }
    : {};

  return {
    dateRange: {
      start: config.dateRange.start,
      end: config.dateRange.end,
    },
    granularity: config.granularity,
    urls: config.urls.sort(),
    grouped: config.grouped,
    metrics: config.metrics.sort(),
    ...breakdownDimension,
  };
}
/**
 * Normalize a QueryConfig to ensure consistent hashing
 * @param config The object to normalize
 */
export function normalizeQueryConfig(config: AAQueryConfig): AAQueryConfig {
  const urls = Array.isArray(config.urls) ? config.urls.sort() : config.urls;
  const metricNames = Array.isArray(config.metricNames)
    ? config.metricNames.sort()
    : config.metricNames;

  return {
    dateRange: {
      start: config.dateRange.start,
      end: config.dateRange.end,
    },
    urls,
    dimensionName: config.dimensionName,
    metricNames,
  };
}

/**
 * Hash a ReportConfig
 * @param config The object to hash
 */
export function hashConfig(config: ReportConfig) {
  return createHash('md5')
    .update(JSON.stringify(normalizeConfig(config)))
    .digest('hex');
}

/**
 * Hash an AAQueryConfig
 * @param config The object to hash
 */
export function hashQueryConfig(config: AAQueryConfig) {
  return createHash('md5')
    .update(JSON.stringify(normalizeQueryConfig(config)))
    .digest('hex');
}
