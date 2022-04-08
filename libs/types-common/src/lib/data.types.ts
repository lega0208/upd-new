import { Page, PageMetrics, Task } from '@cra-arc/db';
import type { GscSearchTermMetrics } from '@cra-arc/db';

export {
  Page,
  PageMetrics,
  Overall,
  CallDriver,
  UxTest,
  Task,
  Project,
} from '@cra-arc/db';

export type {
  PageDocument,
  PageMetricsDocument,
  PageMetricsModel,
  OverallDocument,
  CallDriverDocument,
  UxTestDocument,
  TaskDocument,
  ProjectDocument,
  GscSearchTermMetrics,
} from '@cra-arc/db';

export interface ViewData<T> {
  dateRange: string;
  comparisonDateRange?: string;
  dateRangeData?: T;
  comparisonDateRangeData?: T;
}

export interface EntityDetailsData<T> extends ViewData<T> {
  _id: string;
  title: string;
}

export type PagesHomeAggregatedData = Pick<Page, 'url' | 'title'> & {
  visits: number;
};
export type PagesHomeData = ViewData<PagesHomeAggregatedData[]>;

export type PageDetailsMetrics = Pick<
  PageMetrics,
  | 'visits'
  | 'visitors'
  | 'views'
  | 'visits_device_other'
  | 'visits_device_desktop'
  | 'visits_device_mobile'
  | 'visits_device_tablet'
  | 'average_time_spent'
  | 'gsc_total_clicks'
  | 'gsc_total_impressions'
  | 'gsc_total_ctr'
  | 'gsc_total_position'
  | 'dyf_no'
  | 'dyf_yes'
  | 'dyf_submit'
  | 'fwylf_cant_find_info'
  | 'fwylf_error'
  | 'fwylf_hard_to_understand'
  | 'fwylf_other'
  | 'visits_geo_ab'
  | 'visits_geo_bc'
  | 'visits_geo_mb'
  | 'visits_geo_nb'
  | 'visits_geo_nl'
  | 'visits_geo_ns'
  | 'visits_geo_nt'
  | 'visits_geo_nu'
  | 'visits_geo_on'
  | 'visits_geo_pe'
  | 'visits_geo_qc'
  | 'visits_geo_sk'
  | 'visits_geo_us'
  | 'visits_geo_yt'
  | 'visits_geo_outside_canada'
  | 'visits_referrer_other'
  | 'visits_referrer_searchengine'
  | 'visits_referrer_social'
  | 'visits_referrer_typed_bookmarked'
  // | 'num_searches_internal' // todo: to be added
>;

export interface PageAggregatedData extends PageDetailsMetrics {
  visitsByDay: { date: Date; visits: number }[];
}

export interface PageDetailsData extends EntityDetailsData<PageAggregatedData> {
  url: string;
  topSearchTermsIncrease?: GscSearchTermMetrics[];
  topSearchTermsDecrease?: GscSearchTermMetrics[];
  top25GSCSearchTerms?: GscSearchTermMetrics[];
  tasks?: Task[];
}

export interface OverviewAggregatedData {
  visitors: number;
  visits: number;
  pageViews: number;
  impressions: number;
  ctr: number;
  position: number;
  dyf_yes: number;
  dyf_no: number;
  dyf_submit: number;
  fwylf_error: number;
  fwylf_hard_to_understand: number;
  fwylf_other: number;
  fwylf_cant_find_info: number;
  visitsByDay: { date: Date; visits: number }[];
  topPagesVisited: { url: string; visits: number }[];
  top10GSC: GscSearchTermMetrics[];
}

export type OverviewData = ViewData<OverviewAggregatedData>;

export interface TasksHomeAggregatedData {
  _id: string;
  title: string;
  group: string;
  topic: string;
  subtopic: string;
  visits: number;
}
export type TasksHomeData = ViewData<TasksHomeAggregatedData[]>;

export interface TaskDetailsMetrics {
  visits: number;
  dyfYes: number;
  dyfNo: number;
}

export interface TaskDetailsAggregatedData extends TaskDetailsMetrics {
  visitsByPage: { _id: string; title: string; visits: number }[];
}

export interface TaskDetailsData
  extends EntityDetailsData<TaskDetailsAggregatedData> {
  avgTaskSuccessFromLastTest: number;
  taskSuccessByUxTest: { title: string; date: Date; testType: string; successRate: number; }[]
}

export type ProjectStatus =
  | 'Planning'
  | 'In progress'
  | 'Discovery'
  | 'Being monitored'
  | 'Needs review'
  | 'Complete'
  | 'Paused'
  | 'Delayed'
  | 'Unknown';

export interface ProjectsHomeProject {
  _id: string;
  title: string;
  cops: boolean;
  startDate?: Date;
  launchDate?: Date;
  avgSuccessRate?: number;
  status: ProjectStatus;
}

export interface ProjectsHomeData {
  numInProgress: number;
  numCompletedLast6Months: number;
  totalCompleted: number;
  numDelayed: number;
  projects: ProjectsHomeProject[];
}
