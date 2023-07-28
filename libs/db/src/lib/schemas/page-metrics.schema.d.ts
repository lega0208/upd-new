/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types, FilterQuery } from 'mongoose';
import { GscSearchTermMetrics, AccumulatorOperator } from './types';
import { Page } from './page.schema';
import { Task } from './task.schema';
import { Project } from './project.schema';
import { UxTest } from './ux-test.schema';
export declare type PageMetricsDocument = PageMetrics & Document;
export declare class PageMetrics {
  _id: Types.ObjectId;
  url: string;
  date: Date;
  aa_item_id?: string;
  dyf_submit: number;
  dyf_yes: number;
  dyf_no: number;
  views: number;
  visits: number;
  visitors: number;
  average_time_spent: number;
  bouncerate: number;
  rap_initiated: number;
  rap_completed: number;
  nav_menu_initiated: number;
  rap_cant_find: number;
  rap_login_error: number;
  rap_other: number;
  rap_sin: number;
  rap_info_missing: number;
  rap_securekey: number;
  rap_other_login: number;
  rap_gc_key: number;
  rap_info_wrong: number;
  rap_spelling: number;
  rap_access_code: number;
  rap_link_not_working: number;
  rap_404: number;
  rap_blank_form: number;
  fwylf_cant_find_info: number;
  fwylf_other: number;
  fwylf_hard_to_understand: number;
  fwylf_error: number;
  visits_geo_ab: number;
  visits_geo_bc: number;
  visits_geo_mb: number;
  visits_geo_nb: number;
  visits_geo_nl: number;
  visits_geo_ns: number;
  visits_geo_nt: number;
  visits_geo_nu: number;
  visits_geo_on: number;
  visits_geo_outside_canada: number;
  visits_geo_pe: number;
  visits_geo_qc: number;
  visits_geo_sk: number;
  visits_geo_us: number;
  visits_geo_yt: number;
  visits_referrer_other: number;
  visits_referrer_searchengine: number;
  visits_referrer_social: number;
  visits_referrer_typed_bookmarked: number;
  visits_device_other: number;
  visits_device_desktop: number;
  visits_device_mobile: number;
  visits_device_tablet: number;
  gsc_total_clicks: number;
  gsc_total_ctr: number;
  gsc_total_impressions: number;
  gsc_total_position: number;
  gsc_searchterms: GscSearchTermMetrics[];
  page?: Types.ObjectId | Page;
  tasks?: Types.ObjectId[] | Task[];
  projects?: Types.ObjectId[] | Project[];
  ux_tests?: Types.ObjectId[] | UxTest[];
  activity_map?: ActivityMapMetrics[] = [];
}
export declare const PageMetricsSchema: import('mongoose').Schema<
  Document<PageMetrics, any, any>,
  Model<Document<PageMetrics, any, any>, any, any, any>,
  {},
  {}
>;
export declare function getPageMetricsModel(): Model<Document<PageMetrics>>;
export declare type MetricsConfig<T> = {
  [key in AccumulatorOperator]?: keyof Partial<T>;
};
export declare type GetAggregatedMetrics = <T>(
  dateRange: string,
  selectedMetrics: (keyof T | MetricsConfig<T>)[],
  pagesFilter?: FilterQuery<PageMetrics>,
  sortConfig?: {
    [key in keyof Partial<T>]: 1 | -1;
  }
) => Promise<T[]>;
export interface PageMetricsModel extends Model<PageMetricsDocument> {
  getAggregatedPageMetrics: GetAggregatedMetrics;
}
