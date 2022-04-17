import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types, Aggregate } from 'mongoose';
import { GscSearchTermMetrics } from './types';
import { Page } from './page.schema';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';

export type PageMetricsDocument = PageMetrics & Document;

@Schema({ collection: 'pages_metrics' })
export class PageMetrics {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ required: true, type: String, index: true })
  url = '';

  @Prop({ required: true, type: Date, index: true })
  date = new Date(0);

  @Prop({ type: String })
  aa_item_id?: string;

  @Prop({ type: Number })
  dyf_submit = 0;

  @Prop({ type: Number })
  dyf_yes = 0;

  @Prop({ type: Number })
  dyf_no = 0;

  @Prop({ type: Number })
  views = 0;

  @Prop({ type: Number })
  visits = 0;

  @Prop({ type: Number })
  visitors = 0;

  @Prop({ type: Number })
  average_time_spent = 0;

  @Prop({ type: Number })
  bouncerate = 0;

  @Prop({ type: Number })
  rap_initiated = 0;

  @Prop({ type: Number })
  rap_completed = 0;

  @Prop({ type: Number })
  nav_menu_initiated = 0;

  @Prop({ type: Number })
  rap_cant_find = 0;

  @Prop({ type: Number })
  rap_login_error = 0;

  @Prop({ type: Number })
  rap_other = 0;

  @Prop({ type: Number })
  rap_sin = 0;

  @Prop({ type: Number })
  rap_info_missing = 0;

  @Prop({ type: Number })
  rap_securekey = 0;

  @Prop({ type: Number })
  rap_other_login = 0;

  @Prop({ type: Number })
  rap_gc_key = 0;

  @Prop({ type: Number })
  rap_info_wrong = 0;

  @Prop({ type: Number })
  rap_spelling = 0;

  @Prop({ type: Number })
  rap_access_code = 0;

  @Prop({ type: Number })
  rap_link_not_working = 0;

  @Prop({ type: Number })
  rap_404 = 0;

  @Prop({ type: Number })
  rap_blank_form = 0;

  @Prop({ type: Number })
  fwylf_cant_find_info = 0;

  @Prop({ type: Number })
  fwylf_other = 0;

  @Prop({ type: Number })
  fwylf_hard_to_understand = 0;

  @Prop({ type: Number })
  fwylf_error = 0;

  @Prop({ type: Number })
  visits_geo_ab = 0;

  @Prop({ type: Number })
  visits_geo_bc = 0;

  @Prop({ type: Number })
  visits_geo_mb = 0;

  @Prop({ type: Number })
  visits_geo_nb = 0;

  @Prop({ type: Number })
  visits_geo_nl = 0;

  @Prop({ type: Number })
  visits_geo_ns = 0;

  @Prop({ type: Number })
  visits_geo_nt = 0;

  @Prop({ type: Number })
  visits_geo_nu = 0;

  @Prop({ type: Number })
  visits_geo_on = 0;

  @Prop({ type: Number })
  visits_geo_outside_canada = 0;

  @Prop({ type: Number })
  visits_geo_pe = 0;

  @Prop({ type: Number })
  visits_geo_qc = 0;

  @Prop({ type: Number })
  visits_geo_sk = 0;

  @Prop({ type: Number })
  visits_geo_us = 0;

  @Prop({ type: Number })
  visits_geo_yt = 0;

  @Prop({ type: Number })
  visits_referrer_other = 0;

  @Prop({ type: Number })
  visits_referrer_searchengine = 0;

  @Prop({ type: Number })
  visits_referrer_social = 0;

  @Prop({ type: Number })
  visits_referrer_typed_bookmarked = 0;

  @Prop({ type: Number })
  visits_device_other = 0;

  @Prop({ type: Number })
  visits_device_desktop = 0;

  @Prop({ type: Number })
  visits_device_mobile = 0;

  @Prop({ type: Number })
  visits_device_tablet = 0;

  @Prop({ type: Number })
  gsc_total_clicks = 0;

  @Prop({ type: Number })
  gsc_total_ctr = 0;

  @Prop({ type: Number })
  gsc_total_impressions = 0;

  @Prop({ type: Number })
  gsc_total_position = 0;

  @Prop({
    type: [{
      clicks: Number,
      ctr: Number,
      impressions: Number,
      position: Number,
      term: String,
    }]
  })
  gsc_searchterms: GscSearchTermMetrics[] = [];

  @Prop({ type: Types.ObjectId, ref: 'Page', index: true })
  page?: Types.ObjectId | Page;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], index: true })
  tasks?: Types.ObjectId[] | Task[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }], index: true })
  projects?: Types.ObjectId[] | Project[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UxTest' }], index: true })
  ux_tests?: Types.ObjectId[] | UxTest[];
}

export const PageMetricsSchema = SchemaFactory.createForClass(PageMetrics);

PageMetricsSchema.index({ date: 1, url: 1 }, { unique: true })

export function getPageMetricsModel(): Model<Document<PageMetrics>> {
  return model(PageMetrics.name, PageMetricsSchema);
}

export type GetAggregatedMetrics = <T>(
  dateRange: string,
  selectedPages: Page[],
  selectedMetrics: (keyof T)[],
  sortConfig?: Record<keyof PageMetricsDocument, number>
) => Promise<T[]>;

export interface PageMetricsModel extends Model<PageMetricsDocument> {
  getAggregatedPageMetrics: GetAggregatedMetrics;
}

PageMetricsSchema.statics['getAggregatedPageMetrics'] = async function <T extends { url: string }>(
  this: Model<Document<PageMetrics>>,
  dateRange: string,
  selectedPages: Page[],
  selectedMetrics: (keyof T)[],
  sortConfig?: Record<keyof T, number>
): Promise<T[]> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const pageUrls = selectedPages.flatMap((page) => [
    page.url,
    ...(page.all_urls || []),
  ]);

  const pagesByUrl: Record<string, Page> = {};

  for (const page of selectedPages) {
    pagesByUrl[page.url] = page;
  }

  const metricsProjections: Record<string, number> = {};
  const metricsGroupAggregations: Record<string, { $sum: string }> = {};
  const metricsMergeObjects: Record<string, string> = {};
  const metricsSort: Record<string, number> = sortConfig || {};

  for (const metric of selectedMetrics as string[]) {
    metricsProjections[metric] = 1;
    metricsGroupAggregations[metric] = { $sum: `$${metric}` };
    metricsMergeObjects[metric] = `$${metric}`;

    if (!sortConfig) {
      metricsSort[metric] = -1;
    }
  }

  const aggregationQuery = this.aggregate()
    .sort({ date: 1, url: 1 })
    .match({
      url: {
        $in: pageUrls,
      },
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .project({
      url: 1,
      date: 1,
      ...metricsProjections,
    })
    .group({
      _id: '$url',
      ...metricsGroupAggregations,
      doc: {
        $first: '$$ROOT',
      },
    })
    .replaceRoot({
      $mergeObjects: [
        '$doc',
        {
          ...metricsMergeObjects,
        },
      ],
    })
    .sort({ visits: -1 })
    .project({
      url: 1,
      ...metricsProjections,
    }) as Aggregate<T[]>;

  return ((await aggregationQuery.exec()) as T[]).map((result) => ({
    ...result,
    ...pagesByUrl[result.url],
  }));
};
