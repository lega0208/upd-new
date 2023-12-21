import { Types } from 'mongoose';
import type {
  AttachmentData,
  CallsByTopic,
  CallsByTasks,
  FeedbackComment,
  GscSearchTermMetrics,
  TopCalldriverTopics,
  IPage,
  IPageMetrics,
  ITask,
  IUxTest,
  IReadability,
  IAnnotations,
  IReports,
} from './schema.types';

export type ApiParams = {
  dateRange: string;
  comparisonDateRange?: string;
  id?: string;
};

export interface ViewData<T> {
  dateRange: string;
  comparisonDateRange?: string;
  satDateRange?: string;
  satComparisonDateRange?: string;
  dateRangeData?: T;
  comparisonDateRangeData?: T;
  taskList?: string[];
  projectList?: string[];
}

export interface EntityDetailsData<T> extends ViewData<T> {
  _id: string;
  title: string;
}

export type PagesHomeAggregatedData = Pick<IPage, '_id' | 'url' | 'title'> & {
  visits: number;
  pageStatus?: PageStatus;
};
export type PagesHomeData = ViewData<PagesHomeAggregatedData[]>;

export type PageDetailsMetrics = Pick<
  IPageMetrics,
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
  visitsByDay: { date: string; visits: number }[];
  feedbackByTags: { tag: string; numComments: number }[];
  dyfByDay: {
    date: Date;
    dyf_yes: number;
    dyf_no: number;
    dyf_submit: number;
  }[];
}

export interface PageDetailsData extends EntityDetailsData<PageAggregatedData> {
  url: string;
  is404?: boolean;
  isRedirect?: boolean;
  redirect?: string;
  topSearchTermsIncrease?: GscSearchTermMetrics[];
  topSearchTermsDecrease?: GscSearchTermMetrics[];
  top25GSCSearchTerms?: GscSearchTermMetrics[];
  tasks?: ITask[];
  projects?: {
    id: string;
    title: string;
  }[];
  feedbackComments: FeedbackComment[];
  searchTerms: InternalSearchTerm[];
  readability: IReadability[];
  activityMap: ActivityMap[];
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
  visitsByDay: { date: string; visits: number }[];
  calldriversByDay: { date: string; calls: number }[];
  dyfByDay: {
    date: Date;
    dyf_yes: number;
    dyf_no: number;
    dyf_submit: number;
  }[];
  calldriversEnquiry: { enquiry_line: string; sum: number }[];
  topPagesVisited: { url: string; visits: number }[];
  top10GSC: GscSearchTermMetrics[];
  totalFeedback: {
    main_section: string;
    sum: number;
  }[];
  feedbackPages: { _id: string; title: string; url: string; sum: number }[];
  searchAssessmentData: {
    lang: string;
    query: string;
    expected_result: string;
    position: number;
    date: string;
    target_clicks: number;
    total_clicks: number;
    total_searches: number;
  }[];
  annotations: (Omit<IAnnotations, 'event_date'> & { event_date: string })[];
}

export interface OverviewUxData {
  testsCompletedSince2018: number;
  tasksTestedSince2018: number;
  participantsTestedSince2018: number;
  testsConductedLastFiscal: number;
  testsConductedLastQuarter: number;
  copsTestsCompletedSince2018: number;
}

export interface OverviewProject extends ProjectsHomeProject {
  testType?: string[];
  totalUsers: number;
}

export interface OverviewProjectData
  extends Omit<ProjectsHomeData, 'projects'> {
  projects: OverviewProject[];
}

export type OverallSearchTerm = {
  term: string;
  total_searches: number;
  searchesChange?: number | null;
  clicks: number;
  ctr: number;
  position: number;
};

export interface OverviewData
  extends ViewData<OverviewAggregatedData>,
    OverviewUxData {
  projects?: OverviewProjectData;
  uxTests: {
    title: string;
    date?: Date;
    test_type?: string;
    success_rate?: number | null;
    total_users?: number;
    scenario?: string;
  }[];
  top5CalldriverTopics: TopCalldriverTopics[];
  top5IncreasedCalldriverTopics: TopCalldriverTopics[];
  top5DecreasedCalldriverTopics: TopCalldriverTopics[];
  searchTermsEn: OverallSearchTerm[];
  searchTermsFr: OverallSearchTerm[];
}

export type InternalSearchTerm = {
  term: string;
  clicks: number;
  clicksChange?: number | null;
  position: number;
};

export type ActivityMap = {
  link: string;
  clicks: number;
  clicksChange?: number | null | undefined;
};

export interface TasksHomeAggregatedData {
  _id: string | Types.ObjectId;
  title: string;
  group: string;
  subgroup: string;
  topic: string;
  subtopic: string;
  sub_subtopic?: string[];
  program?: string;
  service?: string;
  user_journey?: string[];
  status?: string;
  core?: string[];
  channel?: string[];
  visits: number;
  user_type: string[];
  calls: number;
}

export type TasksHomeData = ViewData<TasksHomeAggregatedData[]> & {
  totalVisits: number;
  percentChange: number;
  totalCalls: number;
  percentChangeCalls: number;
  reports: IReports[];
};

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
  calldriversByDay: { date: string; calls: number }[];
  visitsByDay: { date: string; visits: number }[];
  dyfByDay: { date: string; dyf_yes: number; dyf_no: number }[];
  totalCalldrivers: number;
}

export interface TaskDetailsAggregatedData extends TaskDetailsMetrics {
  visitsByPage: VisitsByPage[];
  feedbackByTags: { tag: string; numComments: number }[];
}

export interface TaskDetailsData
  extends EntityDetailsData<TaskDetailsAggregatedData> {
  group: string;
  subgroup: string;
  topic: string;
  subtopic: string;
  sub_subtopic: string[];
  user_type: string[];
  program: string;
  service: string;
  user_journey: string[];
  status: string;
  channel: string[];
  core: string[];
  avgTaskSuccessFromLastTest: number;
  avgSuccessPercentChange: number;
  dateFromLastTest: Date;
  taskSuccessByUxTest: {
    title: string;
    date: Date;
    test_type: string;
    success_rate: number | null;
    total_users: number;
    scenario: string;
  }[];
  projects: {
    id: string;
    title: string;
    attachments: AttachmentData[];
  }[];
  feedbackComments: FeedbackComment[];
  searchTerms: InternalSearchTerm[];
}

export type ProjectStatus =
  | 'Planning'
  | 'In Progress'
  | 'Exploratory'
  | 'Being monitored'
  | 'Needs review'
  | 'Complete'
  | 'Paused'
  | 'Delayed'
  | 'Unknown';

  export type PageStatus =
  | 'Live'
  | '404'
  | 'Redirected';

  export type ProjectType =
  | 'COPS';

export interface searchAssessmentColTypes {
  query: string;
  url: string;
  position: string | number;
  pass: string;
}
export interface ProjectsHomeProject {
  _id: string;
  title: string;
  cops: boolean;
  startDate?: Date;
  launchDate?: Date;
  avgSuccessRate?: number;
  lastAvgSuccessRate?: number;
  status: ProjectStatus;
  uxTests?: {
    title: string;
    date?: Date;
    success_rate?: number;
    test_type?: string;
    task?: string;
  }[];
}

export interface ProjectsHomeData {
  numInProgress: number;
  numPlanning: number;
  numCompletedLast6Months: number;
  totalCompleted: number;
  numDelayed: number;
  completedCOPS: number;
  projects: ProjectsHomeProject[];
  avgTestSuccessAvg?: number;
  testsCompleted?: number;
}

export interface ReportsHomeProject extends ProjectsHomeProject {
  attachments: AttachmentData[];
}

export interface ReportsData {
  projects: ReportsHomeProject[];
  tasks: IReports[];
}

export interface VisitsByPage {
  _id: string;
  url: string;
  title: string;
  visits: number;
  dyfYes?: number;
  dyfNo?: number;
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
  visitsByDay: { date: string; visits: number }[];
  dyfByDay: { date: string; dyf_yes: number; dyf_no: number }[];
  calldriversByDay: { date: string; calls: number }[];
  feedbackByTags: { tag: string; numComments: number }[];
  calldriversEnquiry: { enquiry_line: string; calls: number }[];
  callsByTopic: CallsByTopic[];
  callsByTasks: CallsByTasks[];
  totalCalldrivers: number;
  pageMetricsByTasks: (Partial<ProjectDetailsAggregatedData> & {
    title: string;
  })[];
}

export interface ProjectsDetailsData
  extends EntityDetailsData<ProjectDetailsAggregatedData> {
  status: ProjectStatus;
  cops?: boolean;
  description?: string;
  startDate: string | undefined;
  launchDate: string | undefined;
  members: string | undefined;
  avgTaskSuccessFromLastTest: number | null;
  avgSuccessPercentChange: number | null;
  dateFromLastTest: Date;
  taskSuccessByUxTest: (Partial<IUxTest> & { tasks: string })[];
  tasks: Pick<ITask, '_id' | 'title'>[];
  feedbackComments: FeedbackComment[];
  searchTerms: InternalSearchTerm[];
  attachments: AttachmentData[];
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
