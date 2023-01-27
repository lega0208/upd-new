import type { UnitType } from 'dayjs';
import { arrayToDictionary } from '../utils-common';
import {
  dateRangeTypes,
  dateRangeConfigs,
  DateRangeConfig,
  today,
  dayjs,
  normalizeUTCDate,
} from './';

// Use to look up specific period types
const _dateRangeConfigs = arrayToDictionary(
  dateRangeConfigs as DateRangeConfig[],
  'type'
);

describe('normalizeUTCDate & "today()"', () => {
  const tomorrowInUTC = new Date();
  // this time should work for any timezone that would be used (if set correctly)
  tomorrowInUTC.setHours(23, 0);

  const todayDate = new Date();
  todayDate.setHours(0);

  const tomorrowDayjs = dayjs(tomorrowInUTC);
  const todayDayjs = dayjs(todayDate);

  const tomorrowDayjsUtc = dayjs.utc(tomorrowInUTC);
  const todayDayjsUtc = dayjs.utc(todayDate);

  const currentDay = todayDate.getDate();

  const datesToTest = {
    tomorrowInUTC,
    todayDate,
    tomorrowDayjs,
    todayDayjs,
    tomorrowDayjsUtc,
    todayDayjsUtc,
  };

  const todayDay = today().date();

  it.concurrent.each(Object.keys(datesToTest))(
    "Should correct the local date if it's after midnight in UTC - %s",
    (dateName) => {
      const date = datesToTest[dateName as keyof typeof datesToTest];

      expect(normalizeUTCDate(date).date()).toEqual(currentDay);
    }
  );

  it('Date returned by "today()" should match the normalized UTC date', () => {
    expect(todayDay).toEqual(currentDay);
  });
});

describe.each(dateRangeTypes)('Methods and date values - %s', (type) => {
  const periodConfig = _dateRangeConfigs[type];
  const dateRange = periodConfig.getDateRange();
  const comparisonDate = periodConfig.getComparisonDate();

  test.concurrent('Period type should exist in dateRangeConfigs', async () =>
    expect(periodConfig).toBeDefined()
  );

  // tests for both start and end
  describe.each(Object.keys(dateRange))('getDateRange - %s', (name) => {
    const date = dateRange[name as keyof typeof dateRange];

    it.concurrent('should be defined', async () => expect(date).toBeDefined());

    it.concurrent('should be utc', async () => expect(date.isUTC()).toBe(true));

    it.concurrent('should have time 00:00:00.000', async () => {
      const units: UnitType[] = ['hour', 'minute', 'second', 'millisecond'];

      const { start, end } = dateRange;

      for (const unit of units) {
        expect(start.get(unit)).toBe(0);
        expect(end.get(unit)).toBe(0);
      }
    });
  });

  test.concurrent(
    'getDateRange - End date should be before the current date',
    async () => {
      const { end } = dateRange;
      expect(end.isBefore(today())).toBe(true);
      expect(end.isBefore(dayjs.utc(today().format('YYYY-MM-DD'))));
    }
  );

  test.concurrent(
    'getComparisonDate - End date should not be 7+ days after the current start date',
    async () => {
      const { start, end } = dateRange;

      const comparisonEnd = periodConfig.getComparisonDate(end);

      const sevenDaysAfterStart = start.add(7, 'days');

      expect(comparisonEnd.isBefore(sevenDaysAfterStart)).toBe(true);
    }
  );

  test.concurrent('getComparisonDate - should be utc', async () =>
    expect(comparisonDate.isUTC()).toBe(true)
  );

  test.concurrent(
    'getComparisonDate - should have time 00:00:00.000',
    async () => {
      const units: UnitType[] = ['hour', 'minute', 'second', 'millisecond'];

      for (const unit of units) {
        expect(comparisonDate.get(unit)).toBe(0);
      }
    }
  );

  test.concurrent('Comparison date should be weekday-aligned', async () => {
    const { start } = _dateRangeConfigs[type].getDateRange();
    const comparisonStart = _dateRangeConfigs[type].getComparisonDate(start);

    const startDay = start.day();
    const comparisonStartDay = comparisonStart.day();

    expect(comparisonStartDay).toEqual(startDay);
  });
});

describe('Fiscal year', () => {
  const periodConfig = _dateRangeConfigs['fiscal_year'];
  const { start, end } = periodConfig.getDateRange();

  test('Period should start on Apr 1st', () => {
    const startMonth = start.month();
    const startDay = start.date();

    // months are 0-indexed for some reason...
    const expectedStartMonth = 3; // 3 -> April
    const expectedStartDay = 1;

    expect(startMonth).toEqual(expectedStartMonth);
    expect(startDay).toEqual(expectedStartDay);
  });

  test('Period should end March 31st', () => {
    const endMonth = end.month();
    const endDay = end.date();

    const expectedEndMonth = 2;
    const expectedEndDay = 31;

    expect(endMonth).toEqual(expectedEndMonth);
    expect(endDay).toEqual(expectedEndDay);
  });

  test.concurrent('Comparison date should be weekday-aligned', async () => {
    const comparisonStart = periodConfig.getComparisonDate(start);

    const startDay = start.day();
    const comparisonStartDay = comparisonStart.day();

    expect(comparisonStartDay).toEqual(startDay);
  });
});

describe.skip('Last 52 weeks', () => {
  // unimplemented
});
