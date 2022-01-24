/*
 * Types from Adobe Analytics Swagger API:
 * https://adobedocs.github.io/analytics-2.0-apis/
 */

import { ReportQueryDimension } from './aa-dimensions';
import { metricIds } from './aa-metrics';

export const SEGMENTS = {
  cra: 's300000938_60e59f8fc002e15213e97a00',
  english: 's300000938_57924078e4b05f8496f06d63',
  french: 's300000938_579240a6e4b00bd9617283bd',
  FWYLF: {
    CANT_FIND_INFO: 's300000938_60ec6b712b7fae2105ab3c07',
    OTHER: 's300000938_60ed8367fa6ab12e495a9a5e',
    HARD_TO_UNDERSTAND: 's300000938_60ec6a6119c8017b0a4dc0be',
    ERROR: 's300000938_60ec6a8ee670b5326fe33de5',
  },
};

export const CALCULATED_METRICS = {
  RAP_CANT_FIND: 'cm300000938_5be205840c00c502875416bf',
  RAP_LOGIN_ERROR: 'cm300000938_5be205840c00c502875416be',
  RAP_OTHER: 'cm300000938_5be20584c66baa7dda682e80',
  RAP_SIN: 'cm300000938_5be205847122f93cfbacf190',
  RAP_INFO_MISSING: 'cm300000938_5be2058465802258e90da8d7',
  RAP_SECUREKEY: 'cm300000938_5be205845759f05da544c860',
  RAP_OTHER_LOGIN: 'cm300000938_5be20585f4b4b97693450ea3',
  RAP_GC_KEY: 'cm300000938_5be20584fd66954d322dbdc3',
  RAP_INFO_WRONG: 'cm300000938_5be205845595bc5e15147034',
  RAP_SPELLING: 'cm300000938_5be20584f4b4b97693450e9d',
  RAP_ACCESS_CODE: 'cm300000938_5be205845595bc5e15147033',
  RAP_LINK_NOT_WORKING: 'cm300000938_5be20584d73387096a40a7f7',
  RAP_404: 'cm300000938_5d41aeae7b5c727e37cadf5f',
  RAP_BLANK_FORM: 'cm300000938_5be205847e27304437eed321'
};

export type ReportQueryMetricId = keyof typeof metricIds | typeof CALCULATED_METRICS[keyof typeof CALCULATED_METRICS];

export interface ReportFilter {
  id?: string;
  type: 'dateRange' | 'breakdown' | 'segment' | 'excludeItemIds';
  dimension?: ReportQueryDimension;
  itemId?: string;
  itemIds?: string[];
  segmentId?: string;
  segmentDefinition?: unknown;
  dateRange?: string;
  excludeItemIds?: string[];
}

export interface ReportSearch {
  clause?: string;
  excludeItemIds?: string[];
  itemIds?: string[];
}

export interface ReportSettings {
  limit?: number;
  page?: number;
  dimensionSort?: string;
  countRepeatInstances?: boolean;
  reflectRequest?: boolean;
  includeAnomalyDetection?: boolean;
  includePercentChange?: boolean;
  includeLatLong?: boolean;
  nonesBehavior?: string;
}

export interface ReportStatistics {
  functions?: string[];
  ignoreZeroes?: boolean;
}

export interface ReportMetric {
  id: ReportQueryMetricId;
  columnId: string;
  filters?: string[];
  sort?: string;
  metricDefinition?: unknown;
  predictive?: { anomalyConfidence?: number };
}

export interface ReportRow {
  rowId: string;
  filters?: string[];
}

export interface AdobeAnalyticsReportQuery {
  rsid: string;
  dimension: ReportQueryDimension;
  globalFilters?: ReportFilter[];
  search?: ReportSearch;
  settings?: ReportSettings;
  statistics?: ReportStatistics;
  metricContainer: {
    metricFilters?: ReportFilter[];
    metrics: ReportMetric[];
  };
  rowContainer?: {
    rowFilters?: ReportFilter[];
    rows: ReportRow[];
  };
  anchorDate?: string;
}

export class AdobeAnalyticsQueryBuilder {
  private readonly query: AdobeAnalyticsReportQuery;

  constructor(rsid: string = process.env.AW_REPORTSUITE_ID) {
    this.query = {
      rsid,
      dimension: 'variables/evar12',
      metricContainer: {
        metrics: [],
      },
    };
  }

  public setDimension(dimension: ReportQueryDimension) {
    this.query.dimension = dimension;
    return this;
  }

  public addMetric(metricId: ReportQueryMetricId, columnId: string, filters?: string[]): this {
    const metric = {
      id: metricId,
      columnId,
      filters: filters,
    };

    this.query.metricContainer.metrics.push(metric);
    return this;
  }

  public setMetricFilters(filters: ReportFilter[]) {
    this.query.metricContainer.metricFilters = filters;
    return this;
  }

  public setRowFilters(filters: ReportFilter[]) {
    if (!this.query.rowContainer) {
      this.query.rowContainer = {
        rowFilters: [],
        rows: [],
      };
    }

    if (!this.query.rowContainer.rowFilters) {
      this.query.rowContainer.rowFilters = [];
    }

    this.query.rowContainer.rowFilters = filters;

    return this;
  }

  public setRows(rows: ReportRow[]) {
    if (!this.query.rowContainer) {
      this.query.rowContainer = {
        rowFilters: [],
        rows: rows,
      };
    }

    return this;
  }

  public setGlobalFilters(filters: ReportFilter[]) {
    this.query.globalFilters = filters;
    return this;
  }

  public setSearch(search: ReportSearch) {
    this.query.search = search;
    return this;
  }

  public setSettings(settings: ReportSettings) {
    this.query.settings = settings;
    return this;
  }

  public setStatistics(statistics: ReportStatistics) {
    this.query.statistics = statistics;
    return this;
  }

  public setAnchorDate(date: string) {
    this.query.anchorDate = date;
  }

  public build(): AdobeAnalyticsReportQuery {
    if (this.query.metricContainer.metrics.length === 0) {
      throw new Error('Tried to build a query with no metrics, a query must have at least one metric');
    }

    return this.query;
  }

  public toJSON(): string {
    return JSON.stringify(this.query);
  }
}

export const queryDateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS';

export function toQueryFormat(date: string): string {
  return date + 'T00:00:00.000';
}
