import {
  FilterDimension,
  FilterOperator,
  Dimension,
  AggregationType,
  DataState,
  QueryType,
} from './gsc-property';

export interface SearchFilter {
  dimension?: FilterDimension;
  operator?: FilterOperator;
  expression?: string;
}

export interface SearchAnalyticsReportQueryBody {
  startDate?: string;
  endDate?: string;
  dimensions?: Dimension[];
  type?: QueryType;
  dimensionFilterGroups?: [
    {
      filters?: SearchFilter[];
      groupType?: string;
    }
  ];
  aggregationType?: AggregationType;
  rowLimit?: number;
  startRow?: number;
  dataState?: DataState;
}

export interface SearchAnalyticsReportQuery {
  siteUrl: string,
  requestBody: SearchAnalyticsReportQueryBody,
}

export class SearchAnalyticsQueryBuilder {
  private readonly query: SearchAnalyticsReportQueryBody;

  constructor() {
    this.query = {
      type: 'web',
    };
  }

  public setStartDate(startDate: string) {
    this.query.startDate = startDate;
    return this;
  }

  public setEndDate(endDate: string) {
    this.query.endDate = endDate;
    return this;
  }

  public addDimensions(dimensions: Dimension | Dimension[]) {
    if (!Array.isArray(dimensions)) {
      dimensions = [dimensions];
    }

    if (!this.query.dimensions) {
      this.query.dimensions = [];
    }

    this.query.dimensions.push(...dimensions);

    return this;
  }

  public setRowLimit(rowLimit: number) {
    this.query.rowLimit = rowLimit;
    return this;
  }

  public setStartRow(startRow: number) {
    this.query.startRow = startRow;
    return this;
  }

  public setAggregationType(aggregationType: AggregationType) {
    this.query.aggregationType = aggregationType;
    return this;
  }

  public setDataState(dataState: DataState) {
    this.query.dataState = dataState;
    return this;
  }

  public setFilters(searchFilters: SearchFilter[]) {
    this.query.dimensionFilterGroups = [{ filters: searchFilters }];

    return this;
  }

  public build(): SearchAnalyticsReportQuery {
    if (this.query.dimensions && this.hasDuplicates(this.query.dimensions)) {
      throw new Error(
        'Tried to build the query but found the same value in dimension, they must be unique'
      );
    }

    return {
      siteUrl: 'https://www.canada.ca/',
      requestBody: this.query,
    };
  }

  public hasDuplicates(array) {
    return new Set(array).size !== array.length;
  }
}
