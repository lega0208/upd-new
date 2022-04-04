import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
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
import type { PageMetricsModel } from '@cra-arc/types-common'
import { Model, Types } from 'mongoose';
import { ApiParams } from '@cra-arc/upd/services';

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getPagesHomeData(dateRange: string): Promise<PagesHomeData> {
    const cachedData = await this.cacheManager.get(
      `pages-home-data-${dateRange}`
    ) as PagesHomeAggregatedData[];

    if (cachedData) {
      // for some reason the cache gets cleared when .get() is called, so we'll just re-save it every time
      await this.cacheManager.set(`pages-home-data-${dateRange}`, cachedData);

      return {
        dateRange,
        dateRangeData: cachedData
      };
    }

    const selectedPages: Page[] = await this.pageModel
      .find({ airtableId: { $exists: true } })
      .lean();

    const results =
      await this.pageMetricsModel.getAggregatedPageMetrics<PagesHomeAggregatedData>(
        dateRange,
        selectedPages,
        ['visits']
      );

    await this.cacheManager.set(`pages-home-data-${dateRange}`, results);

    return {
      dateRange,
      dateRangeData: results
    };
  }

  async getPageDetails(params: ApiParams): Promise<PageDetailsData> {
    if (!params.id) {
      throw Error(
        'Attempted to get Page details from API but no id was provided.'
      );
    }

    const page = await this.pageModel
      .findById(new Types.ObjectId(params.id), { title: 1, url: 1, tasks: 1 })
      .populate('tasks')
      .lean();

    const dateRangeData = (
      await this.pageMetricsModel.getAggregatedPageMetrics<PageAggregatedData>(
        params.dateRange,
        [page],
        [
          'visits',
          'visitors',
          'views',
          'visits_device_other',
          'visits_device_desktop',
          'visits_device_mobile',
          'visits_device_tablet',
          'average_time_spent',
        ]
      )
    )[0];

    const dateRangeDataByDay = await this.getPageDetailsDataByDay(
      page,
      params.dateRange
    );

    const comparisonDateRangeData = (
      await this.pageMetricsModel.getAggregatedPageMetrics<PageAggregatedData>(
        params.comparisonDateRange,
        [page],
        [
          'visits',
          'visitors',
          'views',
          'visits_device_other',
          'visits_device_desktop',
          'visits_device_mobile',
          'visits_device_tablet',
          'average_time_spent',
        ]
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

    const topDecreasedSearchTerms = getTop5DecreaseSearchTerms(
      searchTermsWithPercentChange
    );

    return {
      ...page,
      dateRange: params.dateRange,
      dateRangeData: {
        ...dateRangeData,
        visitsByDay: dateRangeDataByDay.map((data) => ({
          date: data.date,
          visits: data.visits,
        })),
      },
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: {
        ...comparisonDateRangeData,
        visitsByDay: comparisonDateRangeDataByDay.map((data) => ({
          date: data.date,
          visits: data.visits,
        })),
      },
      topSearchTermsIncrease: topIncreasedSearchTerms,
      topSearchTermsDecrease: topDecreasedSearchTerms,
    } as PageDetailsData;
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
