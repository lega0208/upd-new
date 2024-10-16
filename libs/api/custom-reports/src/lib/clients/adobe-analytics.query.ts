import { AdobeAnalyticsQueryBuilder } from '@dua-upd/node-utils';
import { defaultQuerySettings } from '@dua-upd/types-common';
import type { AAQueryConfig } from '@dua-upd/types-common';
import { dimension, metricsConfig } from './adobe-analytics.config';

export function createQuery(config: AAQueryConfig) {
  const queryBuilder = new AdobeAnalyticsQueryBuilder();

  const { dateRange, metricNames, dimensionName, urls } = config;

  const segmentDefinition = createUrlSegment(urls);

  return queryBuilder
    .setDimension(dimension(dimensionName))
    .setMetrics(metricsConfig(metricNames))
    .setGlobalFilters([
      {
        type: 'dateRange',
        dateRange: `${dateRange.start.replace(
          /z$/i,
          '',
        )}/${dateRange.end.replace(/z$/i, '')}`,
      },
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
