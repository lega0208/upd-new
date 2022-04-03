import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Overall, OverallDocument } from '@cra-arc/db';
import { FilterQuery, Model } from 'mongoose';
import { ApiParams } from '@cra-arc/upd/services';
import { OverviewAggregatedData, OverviewData } from '@cra-arc/types-common';

@Injectable()
export class OverallService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>
  ) {}

  async getMetrics(params: ApiParams): Promise<OverviewData> {
    return {
      dateRange: params.dateRange,
      comparisonDateRange: params.comparisonDateRange,
      dateRangeData: await getOverviewMetrics(this.overallModel, params.dateRange),
      comparisonDateRangeData: await getOverviewMetrics(this.overallModel, params.comparisonDateRange),
    } as OverviewData;
  }
}

async function getOverviewMetrics(
  overallModel: Model<OverallDocument>,
  dateRange: string
): Promise<OverviewAggregatedData> {
  const [startDate, endDate] = dateRange
    .split('/')
    .map((d) => new Date(d));

  const dateQuery: FilterQuery<Date> = {};

  dateQuery.$gte = new Date(startDate);
  dateQuery.$lte = new Date(endDate);

  const visitsByDay = await overallModel
    .find({ date: dateQuery }, { _id: 0, date: 1, visits: 1 })
    .sort({ date: 1 })
    .lean();

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
    })
    .group({
      _id: null,
      visitors: { $sum: '$visitors' },
      visits: { $sum: '$visits' },
      pageViews: { $sum: '$views' },
      impressions: { $sum: '$gsc_total_impressions' },
      ctr: { $avg: '$gsc_total_ctr' },
      avgRank: { $avg: '$gsc_total_position' },
    })
    .project({ _id: 0 })
    .exec();

  return {
    visitsByDay,
    ...aggregatedMetrics[0],
  };
}
