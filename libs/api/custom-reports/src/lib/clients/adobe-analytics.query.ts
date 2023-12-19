import { AdobeAnalyticsQueryBuilder } from '@dua-upd/external-data';
import { defaultQuerySettings } from '@dua-upd/types-common';
import type { AAQueryConfig } from '@dua-upd/types-common';
import { dimension, metricsConfig } from './adobe-analytics.config';

// @@@@@@@@@ - test this with the new client to make sure everything makes sense so far
// @@@@@@@@@ - start setting up ReportConfig-to-"multiquery" logic
// @@@@@@@@@    - start ironing out the different kinds of queries/what can be combined/what different patterns might be needed
// @@@@@@@@@    - probably best to keep queries as uniform as possible, even at the cost of performance/throughput
// @@@@@@@@@ - start mapping out and implementing the overall flow of:
// @@@@@@@@@    -> config
// @@@@@@@@@    -> (filter existing)
// @@@@@@@@@    -> split queries
// @@@@@@@@@    -> (filter existing)
// @@@@@@@@@    -> parse results
// @@@@@@@@@    -> write to db
// @@@@@@@@@    -> read and combine results
// @@@@@@@@@        - start with just combining individual pieces, then if there's time, look into materialized views
// @@@@@@@@@             or precomputing reports in general
export function createQuery(config: AAQueryConfig) {
  const queryBuilder = new AdobeAnalyticsQueryBuilder();

  const { dateRange, metricNames, dimensionName, urls } = config;

  const segmentDefinition = createUrlSegment(urls);

  return queryBuilder
    .setDimension(dimension(dimensionName))
    .setMetrics(metricsConfig(metricNames))
    .setGlobalFilters([
      { type: 'dateRange', dateRange: `${dateRange.start}/${dateRange.end}` },
      { type: 'segment', segmentDefinition },
      // <- breakdown goes here if not using dimension
    ])
    .setSettings(defaultQuerySettings)
    .build();
}

export function createUrlSegment(urls: string | string[]) {
  const pred = Array.isArray(urls)
    ? {
        func: 'streq-in',
        list: urls.map((url) => url.slice(-255)),
      }
    : {
        func: 'streq',
        str: urls.slice(-255),
      };

  return {
    func: 'segment',
    container: {
      func: 'container',
      context: 'hits',
      pred: {
        ...pred,
        val: { func: 'attr', name: dimension('url_last_255') },
        description: 'Page URL Last 255 Chars (v22)',
      },
    },
    version: [1, 0, 0],
  };
}
