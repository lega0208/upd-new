export type ReportGranularity = 'day' | 'week' | 'month' | 'year' | 'none';

export type ReportMetric = {
  id: string;
  label: string;
  description: string;
};

export type ReportDimension = {
  id: string;
  label: string;
  description: string;
};

export type ReportConfig = {
  dateRange: {
    start: string;
    end: string;
  };
  granularity: ReportGranularity;
  urls: string[];
  grouped: boolean;
  metrics: string[];
  breakdownDimension?: string;
};

export type ReportCreate = {
  _id: string;
};

export type ReportCreateError = {
  error: string;
};

export type ReportCreateResponse = ReportCreate | ReportCreateError;

export type ReportStatus = {
  status: 'pending' | 'complete' | 'error';
  message?: string;
  // unknown for now
  data?: unknown;
};
