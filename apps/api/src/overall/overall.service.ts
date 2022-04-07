import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Overall, OverallDocument } from '@cra-arc/db';
import type { PageMetricsModel } from '@cra-arc/types-common';
import { FilterQuery, Model } from 'mongoose';
import { ApiParams } from '@cra-arc/upd/services';
import { OverviewAggregatedData, OverviewData } from '@cra-arc/types-common';
import { PageMetrics } from '@cra-arc/types-common';

@Injectable()
export class OverallService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel
  ) {}

  async getMetrics(params: ApiParams): Promise<OverviewData> {
    return {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        params.dateRange
      ),
      comparisonDateRangeData: await getOverviewMetrics(
        this.overallModel,
        this.pageMetricsModel,
        params.comparisonDateRange
      ),
    } as OverviewData;
  }
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  PageMetricsModel: PageMetricsModel,
  dateRange: string
): Promise<OverviewAggregatedData> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateQuery: FilterQuery<Date> = {};

  dateQuery.$gte = new Date(startDate);
  dateQuery.$lte = new Date(endDate);

  const visitsByDay = await overallModel
    .find({ date: dateQuery }, { _id: 0, date: 1, visits: 1 })
    .sort({ date: 1 })
    .lean();

  const topPagesVisited = await PageMetricsModel.aggregate()
    .match({ date: dateQuery })
    .group({ _id: '$url', visits: { $sum: '$visits' } })
    .sort({ visits: -1 })
    .limit(10)
    .exec();

  const top10GSC = await overallModel
    .aggregate()
    .match({ date: dateQuery })
    .unwind('$gsc_searchterms')
    .project({
      term: '$gsc_searchterms.term',
      clicks: '$gsc_searchterms.clicks',
      impressions: '$gsc_searchterms.impressions',
      ctr: '$gsc_searchterms.ctr',
      position: '$gsc_searchterms.position',
    })
    .sort({ term: 1 })
    .group({
      _id: '$term',
      clicks: { $sum: '$clicks' },
      impressions: { $sum: '$impressions' },
      ctr: { $avg: '$ctr' },
      position: { $avg: '$position' },
    })
    .sort({ clicks: -1 })
    .limit(10)
    .exec();

  const aggregatedMetrics = await overallModel
    .aggregate<Omit<OverviewAggregatedData, 'visitsByDay'>>()
    .match({
      date: dateQuery,
    })
    .project({
      visitors: 1,
      visits: 1,
      views: 1,
      gsc_total_impressions: 1,
      gsc_total_ctr: 1,
      gsc_total_position: 1,
      dyf_yes: 1,
      dyf_no: 1,
      dyf_submit: 1,
      fwylf_error: 1,
      fwylf_hard_to_understand: 1,
      fwylf_other: 1,
      fwylf_cant_find_info: 1,
    })
    .group({
      _id: null,
      visitors: { $sum: '$visitors' },
      visits: { $sum: '$visits' },
      pageViews: { $sum: '$views' },
      impressions: { $sum: '$gsc_total_impressions' },
      ctr: { $avg: '$gsc_total_ctr' },
      position: { $avg: '$gsc_total_position' },
      dyf_yes: { $sum: '$dyf_yes' },
      dyf_no: { $sum: '$dyf_no' },
      dyf_submit: { $sum: '$dyf_submit' },
      fwylf_error: { $sum: '$fwylf_error' },
      fwylf_hard_to_understand: { $sum: '$fwylf_hard_to_understand' },
      fwylf_other: { $sum: '$fwylf_other' },
      fwylf_cant_find_info: { $sum: '$fwylf_cant_find_info' },
    })
    .project({ _id: 0 })
    .exec();

  return {
    visitsByDay,
    ...aggregatedMetrics[0],
    topPagesVisited,
    top10GSC,
  };
}
