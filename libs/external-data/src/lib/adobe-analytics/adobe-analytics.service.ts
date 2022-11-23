import { ConsoleLogger, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  AAItemId,
  AASearchTermMetrics,
  Overall,
  PageMetrics,
} from '@dua-upd/db';
import chalk from 'chalk';
import { logJson, wait } from '@dua-upd/utils-common';
import { DateRange } from '../types';
import {
  AdobeAnalyticsClient,
  createBatchedInternalSearchQueries,
  createInternalSearchItemIdsQuery,
  createInternalSearchQuery,
  createOverallMetricsQuery,
  createPageMetricsQuery,
  PageMetricsQueryOptions,
  toQueryFormat,
} from './';

dayjs.extend(utc);

export type SearchTermResult = {
  date: string;
  term: string;
  clicks: number;
  position: number;
};

export type InternalSearchResult = {
  date?: Date;
  aa_searchterms: AASearchTermMetrics[];
  itemId?: string;
};

@Injectable()
export class AdobeAnalyticsService {
  private readonly client = new AdobeAnalyticsClient();

  constructor(private logger: ConsoleLogger) {}

  async getOverallMetrics(
    dateRange: DateRange,
    options?: {
      onComplete?: <U>(
        data: Overall[]
      ) => U extends Promise<any> ? U : Promise<U>;
      inclusiveDateRange?: boolean;
    }
  ) {
    const endDate = options?.inclusiveDateRange
      ? dayjs.utc(dateRange.end).add(1, 'day').format('YYYY-MM-DD')
      : dateRange.end;

    return await this.client.executeQuery<Overall>(
      createOverallMetricsQuery({
        start: toQueryFormat(dateRange.start),
        end: toQueryFormat(endDate),
      }),
      {
        hooks: {
          pre: (dateRange) =>
            this.logger.log(`Fetching overall metrics for ${dateRange}:`),
          post: options?.onComplete,
        },
      }
    );
  }

  async getPageMetrics(
    dateRange: DateRange,
    options?: {
      onComplete?: (results: Partial<PageMetrics>[]) => Promise<void>;
    } & PageMetricsQueryOptions
  ) {
    return await this.client.executeMultiDayQuery<PageMetrics>(
      {
        start: toQueryFormat(dateRange.start),
        end: toQueryFormat(dateRange.end),
      },
      (dateRange) =>
        createPageMetricsQuery(dateRange, {
          // search: {
          //   clause: pageMetricsExcludeClauses,
          // },
          ...options,
        }),
      {
        pre: (dateRange) =>
          this.logger.log(`Fetching page metrics from AA for ${dateRange}:`),
        post: options?.onComplete,
      },
      true
    );
  }

  async getInternalSearchItemIds({ start, end }: DateRange) {
    const query = createInternalSearchItemIdsQuery(
      {
        start: toQueryFormat(start),
        end: toQueryFormat(end),
      },
      {
        limit: 50000,
      }
    );

    return await this.client.executeQuery<AAItemId>(query);
  }

  async getOverallSearchTerms(
    dateRange: DateRange,
    lang: 'en' | 'fr',
    options?: {
      onComplete?: (results: SearchTermResult[]) => Promise<void>;
    }
  ) {
    dateRange = {
      start: toQueryFormat(dateRange.start),
      end: toQueryFormat(dateRange.end),
    };

    return await this.client.executeMultiDayQuery<AASearchTermMetrics>(
      dateRange,
      (dateRange) =>
        createInternalSearchQuery(dateRange, [], {
          limit: 400,
          lang: lang as 'en' | 'fr',
        }),
      {
        pre: (dateRange) =>
          this.logger.log(
            chalk.blueBright(`Getting overall search terms for ${dateRange}...`)
          ),
        post: options?.onComplete,
      },
      true
    );
  }

  async getPageSearchTerms(dateRange: DateRange, itemIdDocs: AAItemId[]) {
    const itemIds = itemIdDocs.map(({ itemId }) => itemId);

    const queries = createBatchedInternalSearchQueries(dateRange, itemIds);

    const queryPromises: Promise<InternalSearchResult[]>[] = [];

    for (const [i, query] of queries.entries()) {
      const promise = this.client.executeQueryWithRetry<InternalSearchResult>(
        query,
        {
          hooks: {
            pre: (date) =>
              this.logger.log(
                `Dispatching (query ${i + 1}) searchterms for ${date}`
              ),
          },
        }
      );

      queryPromises.push(
        promise.catch((err) => this.logger.error(chalk.red(err.stack)))
      );

      await wait(520);
    }

    return (await Promise.all(queryPromises)).flat();
  }
}

const pageMetricsExcludeClauses = `NOT (
              CONTAINS '%' OR
              CONTAINS 'html%20https' OR
              CONTAINS 'htmlhttps' OR
              CONTAINS 'htmlcanada.ca' OR
              CONTAINS 'htmhttps:' OR
              BEGINS-WITH 'apps' OR
              BEGINS-WITH 'buyandsell.gc.ca' OR
              BEGINS-WITH 'cms-sgj' OR
              BEGINS-WITH 'ereg.elections.ca' OR
              BEGINS-WITH 'elections.ca' OR
              BEGINS-WITH 'eservices.cic' OR
              BEGINS-WITH 'food-guide' OR
              BEGINS-WITH 'guide-alimentaire' OR
              BEGINS-WITH 'laws-lois.justice.gc.ca' OR
              BEGINS-WITH 'mmission/services' OR
              BEGINS-WITH 'on/services/staffing-assessment' OR
              BEGINS-WITH 'publications.gc.ca' OR
              BEGINS-WITH 'recherche-search.gc.ca' OR
              BEGINS-WITH 's-ressources-humaines' OR
              BEGINS-WITH 'search-recherche.gc.ca' OR
              BEGINS-WITH 'services3.cic.gc.ca' OR
              BEGINS-WITH 'sources-humaines/centre-psychologie' OR
              BEGINS-WITH 'vice-commission/services' OR
              BEGINS-WITH 'www.agr.gc.ca' OR
              BEGINS-WITH 'www.bac-lac.gc.ca' OR
              BEGINS-WITH 'www.cic.gc.ca' OR
              BEGINS-WITH 'www.elections.ca' OR
              BEGINS-WITH 'www.justice.gc.ca' OR
              BEGINS-WITH 'www.laws-lois.justice.gc.ca' OR
              BEGINS-WITH 'lois-laws.justice.gc.ca' OR
              BEGINS-WITH 'www.nrcan.gc.ca' OR
              BEGINS-WITH 'www.statcan.gc.ca' OR
              BEGINS-WITH 'www.tpsgc-pwgsc.gc.ca' OR
              BEGINS-WITH 'www12.statcan.gc.ca' OR
              BEGINS-WITH 'www120.statcan.gc.ca' OR
              BEGINS-WITH 'www150.statcan.gc.ca' OR
              BEGINS-WITH 'www23.statcan.gc.ca' OR
              BEGINS-WITH 'www5.statcan.gc.ca' OR
              BEGINS-WITH 'www65.statcan.gc.ca' OR
              BEGINS-WITH 'geosuite.statcan.gc.ca' OR
              BEGINS-WITH '-ressources-dotation-evaluation' OR
              BEGINS-WITH '0%20' OR
              BEGINS-WITH 'E2%80%90' OR
              BEGINS-WITH 'achatsetventes.gc.ca' OR
              BEGINS-WITH 'atip-aiprp.tbs-sct' OR
              BEGINS-WITH 'geoprod.statcan.gc.ca' OR
              BEGINS-WITH 'intranet.agr.gc.ca' OR
              BEGINS-WITH 'agr.gc.ca' OR
              BEGINS-WITH 'jusnet.justice.gc.ca' OR
              BEGINS-WITH 'justice.gc.ca' OR
              BEGINS-WITH 'dmteam.justice.gc.ca' OR
              BEGINS-WITH 'www1.canada.ca' OR
              BEGINS-WITH 'clinical-information.canada.ca' OR
              BEGINS-WITH 'ca/en/public-service-commission' OR
              BEGINS-WITH 'ceaa-acee.gc.ca' OR
              BEGINS-WITH 'census.gc.ca' OR
              BEGINS-WITH 'mmission-tests/general-competency-test' OR
              BEGINS-WITH 'opo-boa.gc.ca' OR
              BEGINS-WITH 'ources-humaines/centre-psychologie-personnel' OR
              BEGINS-WITH 'psychology-centre/consultation-test' OR
              BEGINS-WITH 'rp-ut2.isvcs.net' OR
              BEGINS-WITH 'www.ceaa-acee.gc.ca' OR
              BEGINS-WITH 'www.collectionscanada.gc.ca' OR
              BEGINS-WITH 'www.publications.gc.ca' OR
              BEGINS-WITH 'www.rncan.gc.ca' OR
              BEGINS-WITH 'disclosure.esdc.gc.ca' OR
              BEGINS-WITH 'iaac-aeic.gc.ca' OR
              BEGINS-WITH 'apap.gc.ca' OR
              BEGINS-WITH 'assessment-tools-resources' OR
              BEGINS-WITH 'co-lab.bac-lac.gc.ca' OR
              BEGINS-WITH 'inspection.gc.ca' OR
              BEGINS-WITH 'www.inspection.gc.ca' OR
              BEGINS-WITH 'merlin.cfia-acia.inspection.gc.ca' OR
              BEGINS-WITH 'mpmo.gc.ca' OR
              BEGINS-WITH 'www.hamsterdance.com' OR
              BEGINS-WITH 'www.hotspotshield.com' OR
              BEGINS-WITH 'www.html5zombo.com' OR
              BEGINS-WITH 'www.betternet.co' OR
              BEGINS-WITH 'www.infomedia.gc.ca' OR
              BEGINS-WITH 'covid-benefits.alpha.canada.ca' OR
              BEGINS-WITH 'covid-prestations.alpha.canada.ca' OR
              BEGINS-WITH 'ction.gc.ca' OR
              BEGINS-WITH 'localhost/gol-ged' OR
              BEGINS-WITH 'open.canada.ca' OR
              BEGINS-WITH 'search.open.canada.ca' OR
              BEGINS-WITH 'ouvert.canada.ca' OR
              BEGINS-WITH 'rechercher.ouvert.canada.ca' OR
              BEGINS-WITH 'paap.gc.ca' OR
              BEGINS-WITH 'rp-ut.isvcs.net' OR
              BEGINS-WITH 'www.oci-bec.gc.ca' OR
              BEGINS-WITH 'www.search-recherche.gc.ca'
            )`;
