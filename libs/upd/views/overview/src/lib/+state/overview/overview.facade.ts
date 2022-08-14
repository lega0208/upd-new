import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, debounceTime, map, mergeMap, of, pluck } from 'rxjs';

import dayjs, { QUnitType } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';

import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import { OverviewAggregatedData, OverviewData } from '@dua-upd/types-common';
import { percentChange } from '@dua-upd/utils-common';
import type { PickByType } from '@dua-upd/utils-common';
import * as OverviewActions from './overview.actions';
import * as OverviewSelectors from './overview.selectors';
import {
  I18nFacade,
  selectDatePeriodSelection,
  selectUrl,
} from '@dua-upd/upd/state';
import { createColConfigWithI18n } from '@dua-upd/upd/utils';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);

@Injectable()
export class OverviewFacade {
  currentLang$ = this.i18n.currentLang$;
  loaded$ = this.store.select(OverviewSelectors.selectOverviewLoaded);
  loading$ = this.store
    .select(OverviewSelectors.selectOverviewLoading)
    .pipe(debounceTime(500));
  dateRangeSelected$ = this.store.select(selectDatePeriodSelection);
  overviewData$ = this.store.select(OverviewSelectors.selectOverviewData);

  currentRoute$ = this.store
    .select(selectUrl)
    .pipe(map((url) => url.replace(/\?.+$/, '')));

  visitors$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.visitors || 0)
  );
  visitorsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('visitors')
  );

  visits$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.overviewData$.pipe(mapToPercentChange('visits'));

  views$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.pageViews || 0)
  );

  viewsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('pageViews')
  );

  impressions$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.impressions || 0)
  );
  impressionsPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('impressions')
  );

  ctr$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.ctr || 0)
  );
  ctrPercentChange$ = this.overviewData$.pipe(mapToPercentChange('ctr'));

  avgRank$ = this.overviewData$.pipe(
    map((overviewData) => overviewData?.dateRangeData?.position || 0)
  );
  avgRankPercentChange$ = this.overviewData$.pipe(
    mapToPercentChange('position')
  );

  topPagesVisited$ = this.overviewData$.pipe(
    map((data) => data?.dateRangeData?.topPagesVisited || [])
  );

  topPagesVisitedWithPercentChange$ = this.overviewData$.pipe(
    mapObjectArraysWithPercentChange('topPagesVisited', 'visits', 'url')
  );

  top10GSC$ = this.overviewData$.pipe(
    mapObjectArraysWithPercentChange('top10GSC', 'clicks')
  );

  projects$ = this.overviewData$.pipe(
    map((data) => data?.projects?.projects || [])
  );
  testTypeTranslations$ = combineLatest([
    this.projects$,
    this.currentLang$,
  ]).pipe(
    mergeMap(([projects]) => {
      const splitTestTypes = projects.flatMap(
        (project) => project.testType || []
      );

      const testTypes = [...new Set<string>(splitTestTypes)];

      return testTypes.length > 0 ? this.i18n.service.get(testTypes) : of({});
    })
  );

  projectsList$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
    this.testTypeTranslations$,
  ]).pipe(
    map(([data, lang, testTypeTranslations]) => {
      const projects = data?.projects?.projects.map((data) => {
        const testType = (data.testType || []).map((testType: string) => {
          return (
            (testTypeTranslations as Record<string, string>)[testType] ||
            testType
          );
        });

        return {
          ...data,
          title: data.title
            ? this.i18n.service.translate(data.title.replace(/\s+/g, ' '), lang)
            : '',
          testType: testType.sort().join(', '),
          startDate: data.startDate || '',
        };
      });

      return [...(projects || [])];
    })
  );

  calldriversChart$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange || '', lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const dataEnquiryLine = (
        data?.dateRangeData?.calldriversEnquiry || []
      ).map((d) => ({
        name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
        value: d.sum,
      }));

      const comparisonDataEnquiryLine = (
        data?.comparisonDateRangeData?.calldriversEnquiry || []
      ).map((d) => ({
        name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
        value: d.sum,
      }));

      const isCurrZero = dataEnquiryLine.every((v) => v.value === 0);
      const isPrevZero = comparisonDataEnquiryLine.every((v) => v.value === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const dataEnquiryLineFinal = dataEnquiryLine.filter((v) => v.value > 0);
      const comparisonDataEnquiryLineFinal = comparisonDataEnquiryLine.filter(
        (v) => v.value > 0
      );

      const barChartData: MultiSeries = [
        {
          name: dateRangeLabel,
          series: dataEnquiryLineFinal,
        },
        {
          name: comparisonDateRangeLabel,
          series: comparisonDataEnquiryLineFinal,
        },
      ];

      return barChartData;
    })
  );

  calldriversTable$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRange = data?.dateRangeData?.calldriversEnquiry || [];
      const comparisonDateRange =
        data?.comparisonDateRangeData?.calldriversEnquiry || [];

      const dataEnquiryLine = dateRange.map((d) => {
        let prevVal = NaN;
        comparisonDateRange.map((cd) => {
          if (d.enquiry_line === cd.enquiry_line) {
            prevVal = cd.sum;
          }
        });
        return {
          name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
          currValue: d.sum,
          prevValue: prevVal,
        };
      });

      comparisonDateRange.map((d) => {
        let currVal = 0;
        dateRange.map((cd) => {
          if (d.enquiry_line === cd.enquiry_line) {
            currVal = cd.sum;
          }
        });
        if (currVal === 0) {
          dataEnquiryLine.push({
            name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
            currValue: 0,
            prevValue: d.sum,
          });
        }
      });
      return dataEnquiryLine.filter((v) => v.currValue > 0 || v.prevValue > 0);
    })
  );

  isChartDataOver31Days$ = this.overviewData$.pipe(
    map((data) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const days = visitsByDay?.length || 0;

      return days > 31;
    })
  );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  visitsByDay$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
    this.dateRangeSelected$,
  ]).pipe(
    map(([data, lang, dateRangePeriod]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];

      const dateFormat = dateRangePeriod === 'weekly' ? 'dddd' : 'MMM D';
      const dateSelection = dateRangePeriod.replace('ly', '') as QUnitType;

      const isCurrZero = visitsByDay?.every((v) => v.visits === 0);
      const isPrevZero = comparisonVisitsByDay.every((v) => v.visits === 0);

      if (!visitsByDay || (isCurrZero && isPrevZero)) {
        return [] as MultiSeries;
      }

      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);

      const dateRangeDates = visitsByDay.map(({ date }) => date);

      const dateRangeSeries = visitsByDay.map(({ visits }) => ({
        name: dateRangeLabel, // todo: date label (x-axis) formatting based on date range length
        value: visits || 0,
      }));

      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ date, visits }) => ({
          name: comparisonDateRangeLabel,
          date: date,
          value: visits || 0,
        })
      );

      let visitsByDayData: MultiSeries = [];
      let cntPrevVisits = 0;

      const visitsByDaySeries = visitsByDay.map((data, i) => {
        let prevVisits = 0;

        if (
          comparisonVisitsByDay.find(
            (d) =>
              dayjs(d.date)
                .utc(false)
                .add(1, dateSelection)
                .format('YYYY-MM-DD') ===
              dayjs(data.date).utc(false).format('YYYY-MM-DD')
          )
        ) {
          prevVisits = comparisonVisitsByDay[cntPrevVisits].visits;
          cntPrevVisits++;
        }
        return {
          name: dayjs.utc(data.date).locale(lang).format(dateFormat),
          value: prevVisits,
        };
      });

      if (dateRangePeriod !== 'weekly' && dateRangePeriod !== 'monthly') {
        visitsByDayData = [
          {
            name: dateRangeLabel,
            series: dateRangeSeries.map(({ value }, i) => ({
              name: dayjs
                .utc(dateRangeDates[i])
                .locale(lang)
                .format(dateFormat),
              value: value || 0,
            })),
          },
        ];

        if (
          data?.comparisonDateRangeData &&
          typeof data?.comparisonDateRange === 'string'
        ) {
          visitsByDayData.push({
            name: comparisonDateRangeLabel,
            series: visitsByDaySeries,
          });
        }
      } else {
        visitsByDayData = dateRangeDates.map((date, i) => {
          const series = [dateRangeSeries[i]];

          if (comparisonDateRangeSeries[i] !== undefined) {
            series.push(comparisonDateRangeSeries[i]);
          }

          return {
            name: dayjs.utc(date).locale(lang).format(dateFormat),
            series,
          };
        });
      }

      return visitsByDayData;
    })
  );

  calldriversByDay$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
    this.dateRangeSelected$,
  ]).pipe(
    map(([data, lang, dateRangePeriod]) => {
      const calldriversByDay = data?.dateRangeData?.calldriversByDay || [];
      const comparisonCalldriversByDay =
        data?.comparisonDateRangeData?.calldriversByDay || [];
      const visitsByDay = data?.dateRangeData?.visitsByDay || [];

      const dateFormat = dateRangePeriod === 'weekly' ? 'dddd' : 'MMM D';
      const dateSelection = dateRangePeriod.replace('ly', '') as QUnitType;

      let cntPrevCalls = 0,
        cntCurrCalls = 0;

      const callDriversByDay = visitsByDay.map((data, i) => {
        let calls = 0,
          prevCalls = 0,
          prevDate = new Date();

        if (calldriversByDay.find((d) => d.date === data.date)) {
          calls = calldriversByDay[cntCurrCalls].calls;
          cntCurrCalls++;
        }
        if (
          comparisonCalldriversByDay.find(
            (d) =>
              dayjs(d.date)
                .utc(false)
                .add(1, dateSelection)
                .format('YYYY-MM-DD') ===
              dayjs(data.date).utc(false).format('YYYY-MM-DD')
          )
        ) {
          prevCalls = comparisonCalldriversByDay[cntPrevCalls].calls;
          prevDate = comparisonCalldriversByDay[cntPrevCalls].date;
          cntPrevCalls++;
        }
        return {
          name: dayjs.utc(data.date).locale(lang).format(dateFormat),
          currDate: data.date,
          prevDate: prevDate,
          currValue: calls,
          prevValue: prevCalls,
        };
      });

      const dateRangeSeries = callDriversByDay.map((data, i) => {
        return {
          name: data.name,
          value: data.currValue,
          extra: {
            current: dayjs.utc(data.currDate).locale(lang).format('YYYY-MM-DD'),
            previous: dayjs
              .utc(data.prevDate)
              .locale(lang)
              .format('YYYY-MM-DD'),
          },
        };
      });

      const comparisonDateRangeSeries = callDriversByDay.map((data, i) => {
        return {
          name: data.name,
          value: data.prevValue,
        };
      });

      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange || '', lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      if (!calldriversByDay.length || !comparisonCalldriversByDay.length) {
        return [
          {
            name: `${this.i18n.service.translate(
              'calls',
              lang
            )} ${comparisonDateRangeLabel}`,
            series: [],
          },
          {
            name: `${this.i18n.service.translate(
              'calls',
              lang
            )} ${dateRangeLabel}`,
            series: [],
          },
        ] as MultiSeries;
      }

      return [
        {
          name: `${this.i18n.service.translate(
            'calls',
            lang
          )} ${dateRangeLabel}`,
          series: dateRangeSeries,
        },
        {
          name: `${this.i18n.service.translate(
            'calls',
            lang
          )} ${comparisonDateRangeLabel}`,
          series: comparisonDateRangeSeries,
        },
      ];
    })
  );

  chartMerge$ = combineLatest([
    this.dateRangeSelected$,
    this.visitsByDay$,
    this.calldriversByDay$,
  ]).pipe(
    map(([dateRangePeriod, bar, calls]) => {
      const isOver =
        dateRangePeriod !== 'weekly' && dateRangePeriod !== 'monthly' ? 1 : 0;
      if (!isOver) return;

      return [...bar, ...calls];
    })
  );

  currentCallVolume$ = this.overviewData$.pipe(
    map(
      (data) =>
        data?.dateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.sum,
          0
        ) || 0
    )
  );

  comparisonCallVolume$ = this.overviewData$.pipe(
    map(
      (data) =>
        data?.comparisonDateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.sum,
          0
        ) || 0
    )
  );

  callPercentChange$ = combineLatest([
    this.currentCallVolume$,
    this.comparisonCallVolume$,
  ]).pipe(
    map(([currentCalls, comparisonCalls]) =>
      percentChange(currentCalls, comparisonCalls)
    )
  );

  //   currentCalls$ = this.overviewData$.pipe(
  //     pluck('dateRangeData', 'calldriversEnquiry', 'sum')
  //   );

  // todo: reorder bars? (grey then blue instead of blue then grey?)
  //  also clean this up a bit, simplify logic instead of doing everything twice
  barTable$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const days = visitsByDay?.length || 0;
      const prevDays = comparisonVisitsByDay?.length || 0;
      const maxDays = Math.max(days, prevDays);
      const granularity = Math.ceil(days / 7);
      const dateFormat = granularity > 1 ? 'MMM D' : 'dddd';
      let [startDate] = data.dateRange.split('/').map((d) => new Date(d));
      let [prevStartDate] = (data.comparisonDateRange || '')
        .split('/')
        .map((d) => new Date(d));

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const dateRangeSeries = visitsByDay.map(({ date, visits }) => ({
        date,
        visits,
      }));
      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          visits,
        })
      );

      let dayCount = 0;

      while (dayCount < maxDays) {
        const prevMonthDays = getMonthlyDays(prevStartDate);
        const currMonthDays = getMonthlyDays(startDate);

        if (currMonthDays > prevMonthDays) {
          // if the current month has more days than the previous month,
          // we need to pad the previous month with zeros

          const daysToPad = currMonthDays - prevMonthDays;
          comparisonDateRangeSeries.splice(
            dayCount + prevMonthDays,
            0,
            ...Array(daysToPad).fill({
              date: '*',
              visits: 0,
            })
          );

          dayCount += currMonthDays;
        } else {
          // if the current month has less days than the previous month,
          // we need to pad the current month with zeros

          const daysToPad = prevMonthDays - currMonthDays;

          dateRangeSeries.splice(
            dayCount + currMonthDays,
            0,
            ...Array(daysToPad).fill({
              date: '*',
              visits: 0,
            })
          );

          dayCount += prevMonthDays;
        }

        prevStartDate = dayjs.utc(prevStartDate).add(1, 'month').toDate();
        startDate = dayjs.utc(startDate).add(1, 'month').toDate();
      }

      const dateRangeDates = dateRangeSeries.map(({ date }) => date);

      const visitsByDayData = dateRangeDates.map((date, i) => {
        return {
          name: dayjs.utc(date).locale(lang).format(dateFormat),
          currValue: dateRangeSeries[i]?.visits || 0,
          prevValue: comparisonDateRangeSeries[i]?.visits || 0,
        };
      });

      return visitsByDayData;
    })
  );

  tableMerge$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
    this.dateRangeSelected$,
  ]).pipe(
    map(([data, lang, dateRangePeriod]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const calldriversByDay = data?.dateRangeData?.calldriversByDay || [];
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const comparisonCalldriversByDay =
        data?.comparisonDateRangeData?.calldriversByDay || [];

      const dateFormat = dateRangePeriod === 'weekly' ? 'dddd' : 'MMM D';
      const dateSelection = dateRangePeriod.replace('ly', '') as QUnitType;

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const dateRangeSeries = visitsByDay.map(({ date, visits }) => ({
        date,
        visits,
      }));
      const dateRangeSeriesCall = calldriversByDay.map(({ date, calls }) => ({
        date,
        calls,
      }));

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ date, visits }) => ({
          date,
          visits,
        })
      );
      const comparisonDateRangeSeriesCall = comparisonCalldriversByDay.map(
        ({ date, calls }) => ({
          date,
          calls,
        })
      );

      let cntPrevVisits = 0,
        cntCurrCalls = 0,
        cntPrevCalls = 0;

      const visitsByDayData = dateRangeSeries.map((data, i) => {
        let prevVisits = 0,
          calls = 0,
          prevCalls = 0;

        if (dateRangeSeriesCall.find((d) => d.date === data.date)) {
          calls = dateRangeSeriesCall[cntCurrCalls].calls;
          cntCurrCalls++;
        }
        if (
          comparisonDateRangeSeries.find(
            (d) =>
              dayjs(d.date)
                .utc(false)
                .add(1, dateSelection)
                .format('YYYY-MM-DD') ===
              dayjs(data.date).utc(false).format('YYYY-MM-DD')
          )
        ) {
          prevVisits = comparisonDateRangeSeries[cntPrevVisits].visits;
          cntPrevVisits++;
        }
        if (
          comparisonDateRangeSeriesCall.find(
            (d) =>
              dayjs(d.date)
                .utc(false)
                .add(1, dateSelection)
                .format('YYYY-MM-DD') ===
              dayjs(data.date).utc(false).format('YYYY-MM-DD')
          )
        ) {
          prevCalls = comparisonDateRangeSeriesCall[cntPrevCalls].calls;
          cntPrevCalls++;
        }
        return {
          name: dayjs.utc(data.date).locale(lang).format(dateFormat),
          currValue: dateRangeSeries[i]?.visits || 0,
          prevValue: prevVisits,
          callCurrValue: calls,
          callPrevValue: prevCalls,
        };
      });

      return visitsByDayData;
    })
  );

  dateRangeLabel$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang))
  );

  comparisonDateRangeLabel$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  dyfData$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const pieChartData: SingleSeries = [
        { name: yes, value: data?.dateRangeData?.dyf_yes || 0 },
        { name: no, value: data?.dateRangeData?.dyf_no || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  dyfDataApex$ = combineLatest([this.overviewData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const pieChartData: any = [
        data?.dateRangeData?.dyf_yes || 0,
        data?.dateRangeData?.dyf_no || 0,
      ];

      const isZero = pieChartData.every((v: number) => v === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const cantFindInfo = this.i18n.service.translate(
        'd3-cant-find-info',
        lang
      );
      const otherReason = this.i18n.service.translate('d3-other', lang);
      const hardToUnderstand = this.i18n.service.translate(
        'd3-hard-to-understand',
        lang
      );
      const error = this.i18n.service.translate('d3-error', lang);

      const pieChartData: SingleSeries = [
        {
          name: cantFindInfo,
          value: data?.dateRangeData?.fwylf_cant_find_info || 0,
        },
        { name: otherReason, value: data?.dateRangeData?.fwylf_other || 0 },
        {
          name: hardToUnderstand,
          value: data?.dateRangeData?.fwylf_hard_to_understand || 0,
        },
        {
          name: error,
          value: data?.dateRangeData?.fwylf_error || 0,
        },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  comparisonFeedbackTable$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRange = data?.dateRangeData?.totalFeedback || [];
      const comparisonDateRange =
        data?.comparisonDateRangeData?.totalFeedback || [];

      const dataFeedback = dateRange.map((d, i) => {
        let prevVal = NaN;
        comparisonDateRange.map((cd, i) => {
          if (d.main_section === cd.main_section) {
            prevVal = cd.sum;
          }
        });
        return {
          name: this.i18n.service.translate(`${d.main_section}`, lang),
          currValue: d.sum,
          prevValue: prevVal,
        };
      });

      comparisonDateRange.map((d, i) => {
        let currVal = 0;
        dateRange.map((cd, i) => {
          if (d.main_section === cd.main_section) {
            currVal = cd.sum;
          }
        });
        if (currVal === 0) {
          dataFeedback.push({
            name: this.i18n.service.translate(`${d.main_section}`, lang),
            currValue: 0,
            prevValue: d.sum,
          });
        }
      });

      return dataFeedback
        .map((val: any, i) => ({
          ...val,
          percentChange: percentChange(val.currValue, val.prevValue),
        }))
        .filter((v) => v.currValue > 0 || v.prevValue > 0)
        .sort((a, b) => b.currValue - a.currValue)
        .splice(0, 5);
    })
  );

  comparisonFeedbackPagesTable$ = combineLatest([
    this.overviewData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRange = data?.dateRangeData?.feedbackPages || [];
      const comparisonDateRange =
        data?.comparisonDateRangeData?.feedbackPages || [];

      const dataFeedback = dateRange.map((d, i) => {
        let prevVal = NaN;
        comparisonDateRange.map((cd, i) => {
          if (d.url === cd.url) {
            prevVal = cd.sum;
          }
        });
        return {
          name: this.i18n.service.translate(`${d.url}`, lang),
          currValue: d.sum,
          prevValue: prevVal,
          id: d._id,
          title: d.title,
        };
      });

      comparisonDateRange.map((d, i) => {
        let currValue = 0;
        dateRange.map((cd, i) => {
          if (d.url === cd.url) {
            currValue = cd.sum;
          }
        });
        if (currValue === 0) {
          dataFeedback.push({
            name: this.i18n.service.translate(`${d.url}`, lang),
            currValue: 0,
            prevValue: d.sum,
            id: d._id,
            title: d.title,
          });
        }
      });

      return dataFeedback
        .map((val: any, i) => ({
          ...val,
          percentChange: percentChange(val.currValue, val.prevValue),
        }))
        .filter((v) => v.currValue > 0 || v.prevValue > 0)
        .sort((a, b) => b.currValue - a.currValue)
        .splice(0, 5);
    })
  );

  uxTestsCompleted$ = this.overviewData$.pipe(
    map((data) => data.testsCompletedSince2018)
  );
  uxTasksTested$ = this.overviewData$.pipe(
    map((data) => data.tasksTestedSince2018)
  );
  uxParticipantsTested$ = this.overviewData$.pipe(
    map((data) => data.participantsTestedSince2018)
  );
  uxTestsConductedLastFiscal$ = this.overviewData$.pipe(
    map((data) => data.testsConductedLastFiscal)
  );
  uxTestsConductedLastQuarter$ = this.overviewData$.pipe(
    map((data) => data.testsConductedLastQuarter)
  );
  uxCopsTestsCompleted$ = this.overviewData$.pipe(
    map((data) => data.copsTestsCompletedSince2018)
  );

  top5CalldriverTopics$ = this.overviewData$.pipe(
    map((data) =>
      data.top5CalldriverTopics.map((topicData) => ({
        topic: `${topicData.tpc_id}.topic`,
        subtopic: `${topicData.tpc_id}.sub-topic`,
        sub_subtopic: `${topicData.tpc_id}.sub-subtopic`,
        calls: topicData.calls,
        change: topicData.change === 'Infinity' ? Infinity : topicData.change,
      }))
    )
  );

  top5CalldriverTopicsConfig$ = createColConfigWithI18n(this.i18n.service, [
    { field: 'topic', header: 'topic', translate: true },
    { field: 'subtopic', header: 'sub-topic', translate: true },
    { field: 'sub_subtopic', header: 'sub-subtopic', translate: true },
    { field: 'calls', header: 'calls', pipe: 'number' },
    { field: 'change', header: 'comparison', pipe: 'percent' },
  ]);

  top5IncreasedCalldriverTopics$ = this.overviewData$.pipe(
    map((data) =>
      data.top5IncreasedCalldriverTopics.map((topicData) => ({
        topic: `${topicData.tpc_id}.topic`,
        subtopic: `${topicData.tpc_id}.sub-topic`,
        sub_subtopic: `${topicData.tpc_id}.sub-subtopic`,
        calls: topicData.calls,
        change: topicData.change === 'Infinity' ? Infinity : topicData.change,
      }))
    )
  );

  top5IncreasedCalldriverTopicsConfig$ = createColConfigWithI18n(this.i18n.service, [
    { field: 'topic', header: 'topic', translate: true },
    { field: 'subtopic', header: 'sub-topic', translate: true },
    { field: 'sub_subtopic', header: 'sub-subtopic', translate: true },
    { field: 'calls', header: 'calls', pipe: 'number' },
    { field: 'change', header: 'comparison', pipe: 'percent' },
  ]);

  top5DecreasedCalldriverTopics$ = this.overviewData$.pipe(
    map((data) =>
      data.top5DecreasedCalldriverTopics.map((topicData) => ({
        topic: `${topicData.tpc_id}.topic`,
        subtopic: `${topicData.tpc_id}.sub-topic`,
        sub_subtopic: `${topicData.tpc_id}.sub-subtopic`,
        calls: topicData.calls,
        change: topicData.change === 'Infinity' ? Infinity : topicData.change,
      }))
    )
  );

  top5DecreasedCalldriverTopicsConfig$ = createColConfigWithI18n(this.i18n.service, [
    { field: 'topic', header: 'topic', translate: true },
    { field: 'subtopic', header: 'sub-topic', translate: true },
    { field: 'sub_subtopic', header: 'sub-subtopic', translate: true },
    { field: 'calls', header: 'calls', pipe: 'number' },
    { field: 'change', header: 'comparison', pipe: 'percent' },
  ]);

  error$ = this.store.select(OverviewSelectors.selectOverviewError);

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  init() {
    this.store.dispatch(OverviewActions.init());
  }
}

const getWeeklyDatesLabel = (dateRange: string, lang: LocaleId) => {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateFormat = lang === FR_CA ? 'D MMM' : 'MMM D';

  const formattedStartDate = dayjs
    .utc(startDate)
    .locale(lang)
    .format(dateFormat);
  const formattedEndDate = dayjs.utc(endDate).locale(lang).format(dateFormat);

  return `${formattedStartDate}-${formattedEndDate}`;
};

const getMonthlyDays = (date: Date) => {
  return dayjs.utc(date).daysInMonth();
};

type DateRangeDataIndexKey = keyof OverviewAggregatedData &
  keyof PickByType<OverviewAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<OverviewAggregatedData, number>
) {
  return map((data: OverviewData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return 0;
    }

    const current = data?.dateRangeData[propName as DateRangeDataIndexKey];
    const previous =
      data?.comparisonDateRangeData[propName as DateRangeDataIndexKey];

    if (!current || !previous) {
      return 0;
    }

    return percentChange(current, previous);
  });
}

function mapObjectArraysWithPercentChange(
  propName: keyof OverviewAggregatedData,
  propPath: string,
  sortPath?: string
) {
  return map((data: OverviewData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = [...((data?.dateRangeData?.[propName] || []) as any[])];
    const previous = [
      ...((data?.comparisonDateRangeData?.[propName] || []) as any[]),
    ];

    if (!current || !previous) {
      return;
    }

    const propsAreValidArrays =
      Array.isArray(current) &&
      Array.isArray(previous) &&
      current.length > 0 &&
      previous.length > 0 &&
      current.length === previous.length;

    if (propsAreValidArrays) {
      const sortBy = (a: any, b: any) => {
        if (sortPath && a[sortPath] instanceof Date) {
          return a[sortPath] - b[sortPath];
        }

        if (sortPath && typeof a[sortPath] === 'string') {
          return a[sortPath].localeCompare(b[sortPath]);
        }

        return 0;
      };

      current.sort(sortBy);
      previous.sort(sortBy);

      return current.map((val: any, i) => ({
        ...val,
        percentChange: percentChange(
          val[propPath],
          (previous as any)[i][propPath]
        ),
      }));
    }

    throw Error('Invalid data arrays in mapObjectArraysWithPercentChange');
  });
}
