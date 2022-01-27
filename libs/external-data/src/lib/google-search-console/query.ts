import { FilterDimension, FilterOperator, dimension, aggregationType, dataState, type  } from './gsc-property';

export interface SearchFilters {
    dimension?: FilterDimension;
    operator?: FilterOperator;
    expression?: string;
}

export interface SearchAnalyticsReportQuery {
    startDate?: string;
    endDate?: string;
    dimensions?: [ dimension ];
    type?: type;
    dimensionFilterGroups?: [{
        filters?: SearchFilters[];
        groupType?: string;
    }];
    aggregationType?: aggregationType;
    rowLimit?: number;
    startRow?: number;
    dataState?: dataState;
}

export class SearchAnalyticsQueryBuilder {

    private readonly query: SearchAnalyticsReportQuery;

    constructor( ) {
      this.query = {
        type: 'web'
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

    public addDimensions(dimensions: dimension) {
        if (!this.query.dimensions) {
            this.query.dimensions = [ dimensions ];
          }
          else { this.query.dimensions.push(dimensions); }
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

    public setAggregationType(aggregationType: aggregationType) {
        this.query.aggregationType = aggregationType;
        return this;
    }

    public setDataState(dataState: dataState) {
        this.query.dataState = dataState;
        return this;
    }

    public setFilter( SearchFilters: SearchFilters[] ) {

          this.query.dimensionFilterGroups = [{ filters : SearchFilters }];
      
          return this;
    }

    // public addDimensionFilterGroup( SearchFilters: SearchFilters[] ) {
    //     this.query.dimensionFilterGroups = SearchDimensionFilterGroup;
    //     SearchDimensionFilterGroup
    //     return this;
    // }

    public build(): SearchAnalyticsReportQuery {

        if (this.hasDuplicates(this.query.dimensions)) {
           throw new Error('Tried to build the query but found the same value in dimension, they must be unique');
        }
    
        return this.query;
      }

      public hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }
}