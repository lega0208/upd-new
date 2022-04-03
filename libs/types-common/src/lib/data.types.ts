import { GscSearchTermMetrics, Page, PageMetrics, Task } from '@cra-arc/db';

export {
  Page,
  PageDocument,
  PageMetrics,
  PageMetricsDocument,
  Overall,
  OverallDocument,
  CallDriver,
  CallDriverDocument,
  UxTest,
  UxTestDocument,
  Task,
  TaskDocument,
  Project,
  ProjectDocument,
  GscSearchTermMetrics,
} from '@cra-arc/db';

export interface ViewData<T> {
  dateRange: string;
  comparisonDateRange?: string;
  dateRangeData?: T;
  comparisonDateRangeData?: T;
}

export type PagesHomeData = Pick<Page, 'url' | 'title'> & { visits: number };

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
  // | 'num_searches_internal' // todo: to be added
>;

export interface PageAggregatedData extends PageDetailsMetrics {
  visitsByDay: { date: Date; visits: number }[];
}

export interface PageDetailsData extends ViewData<PageAggregatedData> {
  _id: string;
  url: string;
  title: string;
  dateRange: string;
  comparisonDateRange: string;
  dateRangeData?: PageAggregatedData;
  comparisonDateRangeData?: PageAggregatedData;
  topSearchTermsIncrease?: GscSearchTermMetrics[];
  topSearchTermsDecrease?: GscSearchTermMetrics[];
  tasks?: Task[];
}

export interface OverviewAggregatedData {
  visitors: number;
  visits: number;
  pageViews: number;
  impressions: number;
  ctr: number;
  avgRank: number;
  visitsByDay: { date: Date; visits: number }[];
}

export interface OverviewData extends ViewData<OverviewAggregatedData> {
  dateRange: string;
  comparisonDateRange: string;
  dateRangeData?: OverviewAggregatedData;
  comparisonDateRangeData?: OverviewAggregatedData;
}
