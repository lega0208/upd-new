// types for parsed airtable API query results

export interface TaskData {
  airtable_id: string;
  title: string;
  group?: string;
  subgroup?: string;
  topic?: string;
  subtopic?: string;
  user_type?: string[];
  ux_tests?: string[];
  pages?: string[];
}

export interface CalldriverData {
  airtable_id: string;
  date: Date;
  enquiry_line: string;
  topic?: string;
  subtopic?: string;
  sub_subtopic?: string;
  tpc_id: number;
  impact: number;
  calls: number;
}

export interface UxTestData {
  airtable_id: string;
  date?: Date;
  project_title: string;
  success_rate?: number;
  test_type?: string;
  session_type?: string;
  scenario?: string;
  tasks?: string[];
  pages?: string[];
  subtask?: string;
  vendor?: string;
  version_tested?: string;
  github_repo?: string;
  total_users?: number;
  successful_users?: number;
  program?: string;
  branch?: string;
  audience?: string;
  project_lead?: string;
  launch_date?: Date;
  status?: string;
  cops?: boolean;
}

export interface PageData {
  airtable_id: string;
  title: string;
  url: string;
  tasks?: string[];
}
