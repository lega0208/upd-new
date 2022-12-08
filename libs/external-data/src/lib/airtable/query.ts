export type AirTableFields = 'table' | 'base';

export type lang = 'en' | 'fr';

export type FieldRecordQuery = {
  airtable_id: string;
  query: string;
  expected_result?: string;
  expected_position?: number;
  most_clicks?: number;
  date: string;
  total_clicks: number;
  total_searches: number;
  target_clicks: number;
  pass?: boolean;
  url?: string;
};

export type FieldRecord = {
  Query: string;
  'Expected Result'?: string;
  'Expected Position'?: number;
  '1st Result'?: string;
  '1st Position'?: number;
  '2nd Result'?: string;
  '2nd Position'?: number;
  '3rd Result'?: string;
  '3rd Position'?: number;
  '4th Result'?: string;
  '4th Position'?: number;
  '5th Result'?: string;
  '5th Position'?: number;
  'Most Clicks Result'?: string;
  'Most Clicks'?: number;
  'Most Clicks Position'?: number;
  Rank?: number;
  Date?: string;
  'Total Clicks'?: number;
  'Total Searches'?: number;
  'Target Clicks'?: number;
};

export type CreatedFieldRecord = {
  id: string;
  fields: FieldRecord;
};
