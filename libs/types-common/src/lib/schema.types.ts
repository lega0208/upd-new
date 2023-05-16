import { Types } from 'mongoose';

/*
 * AA itemId types
 */
export type AAItemIdTypes =
  | 'internalSearch'
  | 'activityMap'
  | 'urlLast255'
  | 'pageUrl';

export interface IAAItemId {
  _id: Types.ObjectId;
  type: AAItemIdTypes;
  page?: Types.ObjectId;
  itemId: string;
  value: string;
}

/*
 * Calldriver types
 */
export interface CallsByTopic {
  tpc_id: string;
  topic: string;
  subtopic: string;
  sub_subtopic: string;
  calls: number;
}

export interface CallsByTasks {
  title: string;
  calls: number;
}

export interface TopCalldriverTopics extends CallsByTopic {
  change: number | 'Infinity';
}

export interface ICallDriver {
  _id: Types.ObjectId;

  airtable_id: string;

  date: Date;

  enquiry_line: string;

  topic?: string;

  subtopic?: string;

  sub_subtopic?: string;

  tpc_id: number; // Some records don't have a tpc_id, so they will default to this value

  impact: number;

  calls: number;
}

/*
 * Feedback types
 */
export interface FeedbackComment {
  url: string;
  date: Date;
  tag: string;
  whats_wrong: string;
  comment: string;
}

export interface IFeedback {
  _id: Types.ObjectId;

  airtable_id?: string;

  url: string;

  date: Date;

  lang: string;

  comment: string;

  tags?: string[];

  status?: string;

  whats_wrong?: string;

  main_section?: string;

  theme?: string;
}

/*
 * Metrics types
 */
export interface GscSearchTermMetrics {
  term: string;
  clicks: number;
  ctr: number;
  impressions: number;
  position: number;
}

export interface AASearchTermMetrics {
  term: string;
  clicks: number;
  position?: number;
  num_searches?: number;
}

export interface IMetrics {
  _id: Types.ObjectId;

  date: Date;

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

  gsc_searchterms?: GscSearchTermMetrics[];
}

export interface IOverall extends IMetrics {
  aa_searchterms_en?: AASearchTermMetrics[];

  aa_searchterms_fr?: AASearchTermMetrics[];
}

export interface IPageMetrics extends IMetrics {
  url: string;
  aa_searchterms?: AASearchTermMetrics[];
  page?: Types.ObjectId | IPage;
}

/*
 * Page interface
 */
export interface IPage {
  _id: Types.ObjectId;

  url: string;

  all_urls: string[];

  title: string;

  airtable_id?: string;

  itemid_url?: string;

  itemid_activitymap?: string;

  itemid_internalsearch?: string;

  lastChecked?: Date;

  lastModified?: Date;

  tasks?: Types.ObjectId[] | ITask[];

  projects?: Types.ObjectId[] | IProject[];

  ux_tests?: Types.ObjectId[] | IUxTest[];

  url_status?: number;
}

/*
 * Task interface
 */
export interface ITask {
  _id: Types.ObjectId;

  airtable_id: string;

  title: string;

  group: string;

  subgroup: string;

  topic: string;

  subtopic: string;

  sub_subtopic: string[];

  user_type: string[];

  ux_tests?: Types.ObjectId[] | IUxTest[];

  projects?: Types.ObjectId[] | IProject[];

  pages?: Types.ObjectId[] | IPage[];

  date?: string;

  tpc_ids: number[];
  program?: string;
  user_journey?: string[];
  status?: string;
  channel?: string[];
  core?: string[];
}

/*
 * Project interface
 */
export interface IProject {
  _id: Types.ObjectId;

  title: string;

  ux_tests?: Types.ObjectId[] | IUxTest[];

  pages?: Types.ObjectId[] | IPage[];

  tasks?: Types.ObjectId[] | ITask[];
  description?: string;
  attachments?: AttachmentData[];
}

/*
 * UX Test interface
 */
export interface IUxTest {
  _id: Types.ObjectId;

  title: string;

  airtable_id: string;

  project: Types.ObjectId | IProject;

  pages?: Types.ObjectId[] | IPage[];

  tasks?: Types.ObjectId[] | ITask[];

  subtask?: string;

  date?: Date;

  success_rate?: number;

  test_type?: string;

  session_type?: string;

  scenario?: string;

  vendor?: string;

  version_tested?: string;

  github_repo?: string;

  total_users?: number;

  successful_users?: number;

  program?: string;

  branch?: string;

  project_lead?: string;

  launch_date?: Date;

  status?: string;

  cops?: boolean;

  attachments?: AttachmentData[];
}

export interface UrlHash {
  hash: string;
  date: Date;
}
export interface IUrl {
  _id: Types.ObjectId;
  url: string;
  title?: string;
  page?: Types.ObjectId;
  redirect?: string;
  last_checked?: Date;
  last_modified?: Date;
  is_404?: boolean;
  hashes?: UrlHash[];
  latest_snapshot?: string;
}

export interface AttachmentData {
  id: string;
  url: string;
  filename: string;
  size: number;
  storage_url?: string;
}

export interface SearchAssessmentData {
  lang: string;
  query: string;
  expected_url: string;
  expected_position: number;
  pass: boolean;
  visits: number;
}

export interface ReadabilityData {
  url: string;
  date: Date;
  final_fk_score: string;
  fkpoints: string;
  hpoints: string;
  hratio: string;
  len_headings: number;
  len_par: number;
  original_score: string;
  ppoints: string;
  pratio: string;
  data_word: { word: string; count: number }[];
  total_score: number;
  total_words: number;
  total_sentences: number;
  total_syllables: number;
}

export type AccumulatorOperator =
  | '$accumulator'
  | '$addToSet'
  | '$avg'
  | '$count'
  | '$first'
  | '$last'
  | '$max'
  | '$mergeObjects'
  | '$min'
  | '$push'
  | '$stdDevPop'
  | '$stdDevSamp'
  | '$sum';
