import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Feedback, FeedbackModel, MetricsConfig } from '@cra-arc/db';
import {
  Page,
  PageAggregatedData,
  PageDocument,
  PageDetailsData,
  PageMetrics,
  PagesHomeData,
  GscSearchTermMetrics,
  PagesHomeAggregatedData,
} from '@cra-arc/types-common';
import type { PageMetricsModel } from '@cra-arc/types-common';
import { Model, Types } from 'mongoose';
import { ApiParams } from '@cra-arc/upd/services';

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: FeedbackModel,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getPagesHomeData(dateRange: string): Promise<PagesHomeData> {
    const cacheKey = `getPagesHomeData-${dateRange}`;
    const cachedData = (await this.cacheManager.store.get(
      cacheKey
    )) as PagesHomeAggregatedData[];

    if (cachedData) {
      return {
        dateRange,
        dateRangeData: cachedData,
      };
    }

    const results =
      await this.pageMetricsModel.getAggregatedPageMetrics<PagesHomeAggregatedData>(
        dateRange,
        ['visits'],
        {},
        { visits: -1 }
      );

    await this.cacheManager.set(cacheKey, results);

    return {
      dateRange,
      dateRangeData: results,
    };
  }

  async getPageDetails(params: ApiParams): Promise<PageDetailsData> {
    if (!params.id) {
      throw Error(
        'Attempted to get Page details from API but no id was provided.'
      );
    }
    const cacheKey = `getPageDetails-${params.id}-${params.dateRange}-${params.comparisonDateRange}`;
    const cachedData = await this.cacheManager.store.get<PageDetailsData>(
      cacheKey
    );

    if (cachedData) {
      return cachedData;
    }

    const page = await this.pageModel
      .findById(new Types.ObjectId(params.id), { title: 1, url: 1, tasks: 1 })
      .populate('tasks')
      .lean();

    const queryMetricsConfig = [
      'visits',
      'visitors',
      'views',
      'visits_device_other',
      'visits_device_desktop',
      'visits_device_mobile',
      'visits_device_tablet',
      { $avg: 'average_time_spent' },
      'gsc_total_clicks',
      'gsc_total_impressions',
      { $avg: 'gsc_total_ctr' },
      { $avg: 'gsc_total_position' },
      'dyf_no',
      'dyf_yes',
      'dyf_submit',
      'fwylf_cant_find_info',
      'fwylf_error',
      'fwylf_hard_to_understand',
      'fwylf_other',
      'visits_geo_ab',
      'visits_geo_bc',
      'visits_geo_mb',
      'visits_geo_nb',
      'visits_geo_nl',
      'visits_geo_ns',
      'visits_geo_nt',
      'visits_geo_nu',
      'visits_geo_on',
      'visits_geo_pe',
      'visits_geo_qc',
      'visits_geo_sk',
      'visits_geo_us',
      'visits_geo_yt',
      'visits_geo_outside_canada',
      'visits_referrer_other',
      'visits_referrer_searchengine',
      'visits_referrer_social',
      'visits_referrer_typed_bookmarked',
    ] as (keyof PageAggregatedData | MetricsConfig<PageAggregatedData>)[];

    const dateRangeData = (
      await this.pageMetricsModel.getAggregatedPageMetrics<PageAggregatedData>(
        params.dateRange,
        queryMetricsConfig,
        { page: page._id }
      )
    )[0];

    const dateRangeDataByDay = await this.getPageDetailsDataByDay(
      page,
      params.dateRange
    );

    const comparisonDateRangeData = (
      await this.pageMetricsModel.getAggregatedPageMetrics<PageAggregatedData>(
        params.comparisonDateRange,
        queryMetricsConfig,
        { page: page._id }
      )
    )[0];

    const comparisonDateRangeDataByDay = await this.getPageDetailsDataByDay(
      page,
      params.comparisonDateRange
    );

    const aggregatedSearchTermMetrics =
      aggregateSearchTermMetrics(dateRangeDataByDay);
    const aggregatedComparisonSearchTermMetrics = aggregateSearchTermMetrics(
      comparisonDateRangeDataByDay
    );

    const searchTermsWithPercentChange = getSearchTermsWithPercentChange(
      aggregatedSearchTermMetrics,
      aggregatedComparisonSearchTermMetrics
    );

    const topIncreasedSearchTerms = getTop5IncreaseSearchTerms(
      searchTermsWithPercentChange
    );

    const top25GSCSearchTerms = getTop25SearchTerms(
      searchTermsWithPercentChange
    );

    const topDecreasedSearchTerms = getTop5DecreaseSearchTerms(
      searchTermsWithPercentChange
    );

    const results = {
      ...page,
      dateRange: params.dateRange,
      dateRangeData: {
        ...dateRangeData,
        visitsByDay: dateRangeDataByDay.map((data) => ({
          date: data.date,
          visits: data.visits,
        })),
        feedbackByTags: await this.feedbackModel.getCommentsByTag(
          params.dateRange,
          [page.url]
        ),
      },
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: {
        ...comparisonDateRangeData,
        visitsByDay: comparisonDateRangeDataByDay.map((data) => ({
          date: data.date,
          visits: data.visits,
        })),
        feedbackByTags: await this.feedbackModel.getCommentsByTag(
          params.comparisonDateRange,
          [page.url]
        ),
      },
      topSearchTermsIncrease: topIncreasedSearchTerms,
      topSearchTermsDecrease: topDecreasedSearchTerms,
      top25GSCSearchTerms: top25GSCSearchTerms,
      feedbackComments: await this.feedbackModel.getComments(params.dateRange, [
        page.url,
      ]),
    } as PageDetailsData;

    await this.cacheManager.set(cacheKey, results);

    return results;
  }

  async getPageDetailsDataByDay(page: Page, dateRange: string) {
    const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

    return this.pageMetricsModel
      .find(
        {
          url: page.url,
          date: { $gte: startDate, $lte: endDate },
        },
        { _id: 0, visits: 1, date: 1, gsc_searchterms: 1 }
      )
      .lean();
  }
}

function aggregateSearchTermMetrics(dailyPageMetrics: PageMetrics[]) {
  const metricsBySearchTerm = dailyPageMetrics.reduce(
    (results, { gsc_searchterms }) => {
      for (const searchTermMetrics of gsc_searchterms) {
        if (!results[searchTermMetrics.term]) {
          (results[searchTermMetrics.term] as unknown) = {
            clicks: [],
            ctr: [],
            impressions: [],
            position: [],
          };
        }

        for (const metric of ['clicks', 'ctr', 'impressions', 'position']) {
          results[searchTermMetrics.term][metric].push(
            searchTermMetrics[metric]
          );
        }
      }

      return results;
    },
    {} as Record<string, Record<keyof GscSearchTermMetrics, number[]>>
  );

  return Object.entries(metricsBySearchTerm).reduce(
    (results, [searchTerm, metrics]) => {
      const aggregatedMetrics = {
        clicks: metrics.clicks.reduce((sum, clicks) => sum + clicks, 0),
        ctr:
          metrics.ctr.reduce((sum, ctr) => sum + ctr, 0) / metrics.ctr.length,
        impressions: metrics.impressions.reduce(
          (sum, impressions) => sum + impressions,
          0
        ),
        position:
          metrics.position.reduce((sum, position) => sum + position, 0) /
          metrics.position.length,
      };

      for (const key of Object.keys(aggregatedMetrics)) {
        aggregatedMetrics[key] = Math.round(aggregatedMetrics[key] * 100) / 100;
      }

      results[searchTerm] = {
        ...aggregatedMetrics,
        term: searchTerm,
      } as GscSearchTermMetrics;

      return results;
    },
    {} as Record<string, GscSearchTermMetrics>
  );
}

function getSearchTermsWithPercentChange(
  searchTermMetrics: Record<string, GscSearchTermMetrics>,
  comparisonSearchTermMetrics: Record<string, GscSearchTermMetrics>
): Record<string, GscSearchTermMetrics & { change: number }> {
  const uniqueSearchTerms = new Set([
    ...Object.keys(searchTermMetrics),
    ...Object.keys(comparisonSearchTermMetrics),
  ]);

  const searchTermsWithPercentChange: Record<
    string,
    GscSearchTermMetrics & { change: number }
  > = {};

  for (const searchTerm of uniqueSearchTerms) {
    if (
      searchTermMetrics[searchTerm] &&
      comparisonSearchTermMetrics[searchTerm]
    ) {
      const percentChange =
        (searchTermMetrics[searchTerm].clicks -
          comparisonSearchTermMetrics[searchTerm].clicks) /
        comparisonSearchTermMetrics[searchTerm].clicks;

      searchTermsWithPercentChange[searchTerm] = {
        ...searchTermMetrics[searchTerm],
        change: Math.round(percentChange * 100) / 100,
      };
    }
  }

  return searchTermsWithPercentChange;
}

const getTop25SearchTerms = (
  searchTermsWithPercentChange: Record<
    string,
    GscSearchTermMetrics & { change: number }
  >
) =>
  Object.values(searchTermsWithPercentChange)
    .sort(({ clicks: clicks1 }, { clicks: clicks2 }) => clicks2 - clicks1)
    .slice(0, 25);

const getTop5IncreaseSearchTerms = (
  searchTermsWithPercentChange: Record<
    string,
    GscSearchTermMetrics & { change: number }
  >
) =>
  Object.values(searchTermsWithPercentChange)
    .sort(({ change: change1 }, { change: change2 }) => change2 - change1)
    .slice(0, 5);

const getTop5DecreaseSearchTerms = (
  searchTermsWithPercentChange: Record<
    string,
    GscSearchTermMetrics & { change: number }
  >
) =>
  Object.values(searchTermsWithPercentChange)
    .sort(({ change: change1 }, { change: change2 }) => change1 - change2)
    .slice(0, 5);
