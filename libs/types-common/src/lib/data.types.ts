import { FeedbackComment, Page, PageMetrics, Task, UxTest } from '@dua-upd/db';
import type { GscSearchTermMetrics, CallsByTopic } from '@dua-upd/db';

export {
  Page,
  PageMetrics,
  Overall,
  CallDriver,
  UxTest,
  Task,
  Project,
  Feedback,
} from '@dua-upd/db';

export type {
  PageDocument,
  PageMetricsDocument,
  PageMetricsModel,
  OverallDocument,
  CallDriverDocument,
  CallDriverModel,
  UxTestDocument,
  TaskDocument,
  ProjectDocument,
  GscSearchTermMetrics,
  FeedbackDocument,
  FeedbackComment,
  CallsByTopic,
} from '@dua-upd/db';

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
  feedbackByTags: { tag: string; numComments: number }[];
}

export interface PageDetailsData extends EntityDetailsData<PageAggregatedData> {
  url: string;
  topSearchTermsIncrease?: GscSearchTermMetrics[];
  topSearchTermsDecrease?: GscSearchTermMetrics[];
  top25GSCSearchTerms?: GscSearchTermMetrics[];
  tasks?: Task[];
  projects?: {
    id: string;
    title: string;
  }[];
  feedbackComments: FeedbackComment[];
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
  enquiryLineBE: number;
  enquiryLineBenefits: number;
  enquiryLineC4: number;
  enquiryLineC9: number;
  enquiryLineITE: number;
  enquiryLineEService: number;
  visitsByDay: { date: Date; visits: number }[];
  calldriversByDay: { date: Date; calls: number }[];
  calldriversEnquiry: { enquiry_line: string; sum: number }[];
  topPagesVisited: { url: string; visits: number }[];
  top10GSC: GscSearchTermMetrics[];
  totalFeedback: {
    main_section: string;
    sum: number;
  }[];
  feedbackPages: { _id: string; title: string; url: string; sum: number }[];
}

export interface OverviewUxData {
  testsCompletedSince2018: number;
  tasksTestedSince2018: number;
  participantsTestedSince2018: number;
  testsConductedLastFiscal: number;
  testsConductedLastQuarter: number;
  copsTestsCompletedSince2018: number;
}

export type OverviewProject = ProjectsHomeProject & {
  testType?: string[];
  totalUsers: number;
};

export interface OverviewProjectData
  extends Omit<ProjectsHomeData, 'projects'> {
  projects: OverviewProject[];
}

export interface OverviewData
  extends ViewData<OverviewAggregatedData>,
    OverviewUxData {
  projects?: OverviewProjectData;
}

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
  fwylfCantFindInfo: number;
  fwylfHardToUnderstand: number;
  fwylfOther: number;
  fwylfError: number;
  gscTotalClicks: number;
  gscTotalImpressions: number;
  gscTotalCtr: number;
  gscTotalPosition: number;
  calldriversEnquiry: { enquiry_line: string; calls: number }[];
  callsByTopic: CallsByTopic[];
}

export interface TaskDetailsAggregatedData extends TaskDetailsMetrics {
  visitsByPage: { _id: string; title: string; visits: number }[];
  feedbackByTags: { tag: string; numComments: number }[];
}

export interface TaskDetailsData
  extends EntityDetailsData<TaskDetailsAggregatedData> {
  avgTaskSuccessFromLastTest: number;
  dateFromLastTest: Date;
  taskSuccessByUxTest: {
    title: string;
    date: Date;
    test_type: string;
    success_rate: number | null;
    total_users: number;
  }[];
  projects: {
    id: string;
    title: string;
  }[];
  feedbackComments: FeedbackComment[];
}

export type ProjectStatus =
  | 'Planning'
  | 'In Progress'
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
  numPlanning: number;
  numCompletedLast6Months: number;
  totalCompleted: number;
  numDelayed: number;
  completedCOPS: number;
  projects: ProjectsHomeProject[];
}

export interface VisitsByPage {
  _id: string;
  url: string;
  title: string;
  visits: number;
}

export interface ProjectDetailsAggregatedData {
  visits: number;
  dyfYes: number;
  dyfNo: number;
  fwylfCantFindInfo: number;
  fwylfHardToUnderstand: number;
  fwylfOther: number;
  fwylfError: number;
  gscTotalClicks: number;
  gscTotalImpressions: number;
  gscTotalCtr: number;
  gscTotalPosition: number;
  gscSearchTerms: GscSearchTermMetrics;
  visitsByPage: VisitsByPage[];
  feedbackByTags: { tag: string; numComments: number }[];
  calldriversEnquiry: { enquiry_line: string; calls: number }[];
  callsByTopic: CallsByTopic[];
}

export interface ProjectsDetailsData
  extends EntityDetailsData<ProjectDetailsAggregatedData> {
  status: ProjectStatus;
  avgTaskSuccessFromLastTest: number;
  dateFromLastTest: Date;
  taskSuccessByUxTest: (Partial<UxTest> & { tasks: string })[];
  tasks: Pick<Task, '_id' | 'title'>[];
  feedbackComments: FeedbackComment[];
}

export interface TaskKpi {
  task: string;
  Baseline: number;
  Validation: number;
  Exploratory: number;
  'Spot Check': number;
  change: number;
}

export interface CalldriversTableRow {
  enquiry_line: string;
  currValue: number;
  prevValue: number;
}
