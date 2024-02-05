import { AADimensionId } from './adobe-analytics.dimensions';
import { AAMetricId } from './adobe-analytics.metrics';
import type { AAQueryDateEnd, AAQueryDateStart } from './date.types';

export * from './adobe-analytics.dimensions';
export * from './adobe-analytics.metrics';
export { AAQueryDateEnd, AAQueryDateStart };

export interface ReportSettings {
  limit?: number;
  page?: number;
  dimensionSort?: string;
  countRepeatInstances?: boolean;
  reflectRequest?: boolean;
  includeAnomalyDetection?: boolean;
  includePercentChange?: boolean;
  includeLatLong?: boolean;
  nonesBehavior?: 'exclude-nones' | 'return-nones';
}

export type MetricConfig = {
  id: AAMetricId;
  filters?: ReportFilter[];
};

export interface ReportFilter {
  id?: string;
  type: 'dateRange' | 'breakdown' | 'segment' | 'excludeItemIds';
  dimension?: AADimensionId;
  itemId?: string;
  itemIds?: string[];
  segmentId?: string;
  segmentDefinition?: unknown;
  dateRange?: string;
  excludeItemIds?: string[];
}

export type MetricsConfig = {
  [key: string]: AAMetricId | MetricConfig;
};

export type AuthParams = {
  expiryDateTime?: number;
  organizationId: string;
  technicalId: string;
  companyId: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
};
