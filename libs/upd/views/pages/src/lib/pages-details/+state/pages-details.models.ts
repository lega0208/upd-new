/**
 * Interface for the 'PagesDetails' data
 */
import { GscSearchTermMetrics, PageMetrics, Task } from '@cra-arc/types-common';

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

export interface PageDetailsData {
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


