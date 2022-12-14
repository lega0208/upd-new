
export const dateRangePeriods = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
] as const;

export type DateRangePeriod = typeof dateRangePeriods[number] | 'custom';
