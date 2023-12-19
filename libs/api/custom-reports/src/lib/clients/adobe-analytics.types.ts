import {
  AAResponseBody,
  queryDateFormat,
} from '@dua-upd/external-data';
import { ReportConfig } from '@dua-upd/types-common';
import { dateRangeToGranularity } from '@dua-upd/utils-common';
import {
  AAMetricName,
  AAQueryConfig,
  AAQueryDateRange,
} from '@dua-upd/types-common';

/*
 * The idea here is to lay out the generic types to be used for the
 * "pipeline" for the custom reports. For now focusing on AA and the
 * custom reporting "MVP", but later could potentially be extended/refactored
 * to be used for different data pipelines and include multiple data sources.
 *
 * For right now: Just focus on a basic working implementation, and adjust things as needed.
 */

// thought: this should probably be independent from not only the queues
// but from the data source, and even results processing as well.
// Essentially just a framework that makes reasoning about the data flow easier.
// But using it, we can build on top of it to make cleaner and easier to use abstractions,
// that would presumably be easier to test, maintain, and add to.

export interface ApiClient<Client> {
  client: Client;
  execute<Query, Results>(query: Query): Promise<Results>;
}

export interface ApiQuery<QueryType, ParsedResults> {
  query: QueryType;
  parseResults: <T>(results: T) => ParsedResults;
}

/**
 * Strategy to use for
 */
export interface SingleQueryInsertStrategy<QueryType, Response, ParsedResults> {
  execute: (query: QueryType) => Promise<Response>;
  parseResults: (results: Response) => ParsedResults;
  insertResults: (results: ParsedResults) => Promise<void>;
}

export interface MultiQueryInsertStrategy<
  QueryType,
  Response,
  ParsedResults,
  CombinedResults,
> {
  execute: (query: QueryType) => Promise<Response>;
  parseResults: (results: Response) => ParsedResults;
  combineResults: (results: ParsedResults[]) => CombinedResults;
  insertResults: (results: CombinedResults) => Promise<void>;
}

export interface DataPipeline<QueryType, ParsedResults> {
  execute: (query: QueryType) => Promise<ParsedResults>;
  insertResults: (results: ParsedResults) => Promise<void>;
}

