import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, debounceTime, combineLatest } from 'rxjs';
import dayjs, { ManipulateType, QUnitType } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';

import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade, selectDatePeriodSelection } from '@dua-upd/upd/state';
import { percentChange } from '@dua-upd/utils-common';
import type { PickByType } from '@dua-upd/utils-common';
import type { GscSearchTermMetrics } from '@dua-upd/db';
import { PageAggregatedData, PageDetailsData } from '@dua-upd/types-common';

import * as PagesDetailsActions from './pages-details.actions';
import * as PagesDetailsSelectors from './pages-details.selectors';
import { ApexAxisChartSeries, ApexNonAxisChartSeries } from 'ng-apexcharts';

dayjs.extend(utc);

@Injectable()
export class PagesDetailsFacade {
  loaded$ = this.store.select(PagesDetailsSelectors.selectPagesDetailsLoaded);
  loading$ = this.store
    .select(PagesDetailsSelectors.selectPagesDetailsLoading)
    .pipe(debounceTime(500));
  pagesDetailsData$ = this.store.select(
    PagesDetailsSelectors.selectPagesDetailsData
  );

  currentLang$ = this.i18n.currentLang$;

  dateRangeSelected$ = this.store.select(selectDatePeriodSelection);

  dateRangeLabel$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang)));

  comparisonDateRangeLabel$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  apexBar$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
    this.dateRangeSelected$,
  ]).pipe(
    map(([data, lang, dateRangePeriod]) => {
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );
      const visitsByDay = data?.dateRangeData?.visitsByDay || [];
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const visitsByDayFinal = data?.dateRangeData?.visitsByDay.map((d) => {
        return {
          x: d.date,
          y: d.visits,
        };
      });

      const dateSelection = dateRangePeriod.replace('ly', '') as ManipulateType;

      let cntPrevVisits = 0;

      const comparisonVisitsByDayFinal = visitsByDay.map((data, i) => {
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
          x: data.date,
          y: prevVisits,
        };
      });

      return [
        {
          name: dateRangeLabel,
          data: visitsByDayFinal,
        },
        {
          name: comparisonDateRangeLabel,
          data: comparisonVisitsByDayFinal,
        },
      ] as ApexAxisChartSeries;
    })
  );

  pageTitle$ = this.pagesDetailsData$.pipe(map((data) => data?.title));
  pageUrl$ = this.pagesDetailsData$.pipe(map((data) => data?.url));

  visitors$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitors || 0)
  );
  visitorsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('visitors')
  );

  visits$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  pageViews$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.views || 0)
  );
  pageViewsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('views')
  );

  impressions$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_impressions || 0)
  );
  impressionsPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_impressions')
  );

  ctr$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_ctr || 0)
  );
  ctrPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_ctr')
  );

  avgRank$ = this.pagesDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gsc_total_position || 0)
  );
  avgRankPercentChange$ = this.pagesDetailsData$.pipe(
    mapToPercentChange('gsc_total_position')
  );

  tasks$ = this.pagesDetailsData$.pipe(map((data) => data?.tasks || 0));

  projects$ = combineLatest([this.pagesDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      return (
        data?.projects?.map((d) => ({
          id: d.id,
          title: this.i18n.service.translate(d.title, lang),
        })) || []
      );
    })
  );

  visitsByDay$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
    this.dateRangeSelected$,
  ]).pipe(
    map(([data, lang, dateRangePeriod]) => {
      const visitsByDay = data?.dateRangeData?.visitsByDay;
      const comparisonVisitsByDay =
        data?.comparisonDateRangeData?.visitsByDay || [];
      const days = visitsByDay?.length || 0;
      const prevDays = comparisonVisitsByDay?.length || 0;
      const maxDays = Math.max(days, prevDays);
      const dateFormat = dateRangePeriod === 'weekly' ? 'dddd' : 'MMM D';
      let [startDate] = data.dateRange.split('/').map((d) => new Date(d));
      let [prevStartDate] = (data.comparisonDateRange || '')
        .split('/')
        .map((d) => new Date(d));

      if (!visitsByDay) {
        return [] as MultiSeries;
      }

      const isWeekly = dateRangePeriod === 'weekly' ? true : false;

      const isCurrZero = visitsByDay.every((v) => v.visits === 0);
      const isPrevZero = comparisonVisitsByDay.every((v) => v.visits === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const dateRangeDates = visitsByDay.map(({ date }) => date);
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange, lang);

      const dateRangeSeries = visitsByDay.map(({ visits }, i) => ({
        name: dateRangeLabel, // todo: date label (x-axis) formatting based on date range length
        value: visits || 0,
      }));

      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const comparisonDateRangeSeries = comparisonVisitsByDay.map(
        ({ visits }) => ({
          name: comparisonDateRangeLabel,
          value: visits || 0,
        })
      );

      if (!isWeekly) {
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

          prevStartDate = dayjs(prevStartDate)
            .utc(false)
            .add(1, 'month')
            .toDate();
          startDate = dayjs(startDate).utc(false).add(1, 'month').toDate();
        }
      }

      let visitsByDayData: MultiSeries = [];

      visitsByDayData = [
        {
          name: dateRangeLabel,
          series: dateRangeSeries.map(({ value }, i) => ({
            name: dayjs(dateRangeDates[i])
              .utc(false)
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
          series: comparisonDateRangeSeries.map(({ value }, i) => ({
            name: dayjs(dateRangeDates[i])
              .utc(false)
              .locale(lang)
              .format(dateFormat),
            value: value || 0,
          })),
        });
      }

      return visitsByDayData;
    })
  );

  visitsByDeviceType$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange || '', lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang
      );

      const dataByDeviceType = [
        {
          name: this.i18n.service.translate('Desktop', lang),
          value: data?.dateRangeData?.visits_device_desktop || 0,
        },
        {
          name: this.i18n.service.translate('Mobile', lang),
          value: data?.dateRangeData?.visits_device_mobile || 0,
        },
        {
          name: this.i18n.service.translate('Tablet', lang),
          value: data?.dateRangeData?.visits_device_tablet || 0,
        },
        {
          name: this.i18n.service.translate('Other', lang),
          value: data?.dateRangeData?.visits_device_other || 0,
        },
      ];

      const comparisonDataByDeviceType = [
        {
          name: this.i18n.service.translate('Desktop', lang),
          value: data?.comparisonDateRangeData?.visits_device_desktop || 0,
        },
        {
          name: this.i18n.service.translate('Mobile', lang),
          value: data?.comparisonDateRangeData?.visits_device_mobile || 0,
        },
        {
          name: this.i18n.service.translate('Tablet', lang),
          value: data?.comparisonDateRangeData?.visits_device_tablet || 0,
        },
        {
          name: this.i18n.service.translate('Other', lang),
          value: data?.comparisonDateRangeData?.visits_device_other || 0,
        },
      ];

      const isCurrZero = dataByDeviceType.every((v) => v.value === 0);
      const isPrevZero = comparisonDataByDeviceType.every((v) => v.value === 0);

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const barChartData: MultiSeries = [
        {
          name: dateRangeLabel,
          series: dataByDeviceType,
        },
        {
          name: comparisonDateRangeLabel,
          series: comparisonDataByDeviceType,
        },
      ];

      return barChartData;
    })
  );

  barTable$ = combineLatest([this.pagesDetailsData$, this.currentLang$]).pipe(
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

  visitsByDeviceTypeTable$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      return [
        {
          name: this.i18n.service.translate('Desktop', lang),
          currValue: data?.dateRangeData?.visits_device_desktop || 0,
          prevValue: data?.comparisonDateRangeData?.visits_device_desktop || 0,
        },
        {
          name: this.i18n.service.translate('Mobile', lang),
          currValue: data?.dateRangeData?.visits_device_mobile || 0,
          prevValue: data?.comparisonDateRangeData?.visits_device_mobile || 0,
        },
        {
          name: this.i18n.service.translate('Tablet', lang),
          currValue: data?.dateRangeData?.visits_device_tablet || 0,
          prevValue: data?.comparisonDateRangeData?.visits_device_tablet || 0,
        },
        {
          name: this.i18n.service.translate('Other', lang),
          currValue: data?.dateRangeData?.visits_device_other || 0,
          prevValue: data?.comparisonDateRangeData?.visits_device_other || 0,
        },
      ];
    })
  );

  dyfDataApex$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const pieChartData: any = [
        data?.dateRangeData?.dyf_yes || 0,
        data?.dateRangeData?.dyf_no || 0,
      ] as ApexNonAxisChartSeries;

      const isZero = pieChartData.every((v: number) => v === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongDataApex$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const pieChartData = [
        data?.dateRangeData?.fwylf_cant_find_info || 0,
        data?.dateRangeData?.fwylf_other || 0,
        data?.dateRangeData?.fwylf_hard_to_understand || 0,
        data?.dateRangeData?.fwylf_error || 0,
      ] as ApexNonAxisChartSeries;

      const isZero = pieChartData.every((v) => v === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  apexVisitsByDeviceTypeChart$ = combineLatest([
    this.visitsByDeviceTypeTable$,
  ]).pipe(
    map(([data]) => {
      return data.map(({ name, currValue, prevValue }) => ({
        name,
        data: [currValue, prevValue],
      }));
    })
  );

  apexVisitsByDeviceTypeLabels$ = combineLatest([
    this.visitsByDeviceTypeTable$,
  ]).pipe(
    map(([data]) => {
      return data.map(({ name }) => name);
    })
  );

  referrerTypePropToKeyMap = {
    visits_referrer_other: 'Other Web Sites',
    visits_referrer_searchengine: 'Search Engines',
    visits_referrer_typed_bookmarked: 'Typed/Bookmarked',
    visits_referrer_social: 'Social Networks',
  } as Record<keyof PageAggregatedData, string>;

  referrerType$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dataByReferrerType = Object.entries(
        this.referrerTypePropToKeyMap
      ).map(([prop, refType]) => {
        const currentVal = (data?.dateRangeData?.[
          prop as keyof PageAggregatedData
        ] || 0) as number;
        const previousVal = (data?.comparisonDateRangeData?.[
          prop as keyof PageAggregatedData
        ] || 0) as number;

        const change =
          previousVal === 0
            ? currentVal === 0
              ? 0
              : Infinity
            : (currentVal - previousVal) / previousVal;

        return {
          type: this.i18n.service.translate(refType, lang),
          value: currentVal,
          change,
        };
      });

      const isZero = dataByReferrerType.every((v) => v.value === 0);

      if (isZero) {
        return [] as typeof dataByReferrerType;
      }

      return dataByReferrerType;
    })
  );

  propToProvinceMap = {
    visits_geo_ab: 'Alberta',
    visits_geo_bc: 'British Columbia',
    visits_geo_mb: 'Manitoba',
    visits_geo_nb: 'New Brunswick',
    visits_geo_nl: 'Newfoundland and Labrador',
    visits_geo_ns: 'Nova Scotia',
    visits_geo_nt: 'Northwest Territories',
    visits_geo_nu: 'Nunavut',
    visits_geo_on: 'Ontario',
    visits_geo_pe: 'Prince Edward Island',
    visits_geo_qc: 'Quebec',
    visits_geo_sk: 'Saskatchewan',
    visits_geo_yt: 'Yukon',
    visits_geo_outside_canada: 'Outside Canada',
  } as Record<keyof PageAggregatedData, string>;

  visitorLocation$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dataByLocation = Object.entries(this.propToProvinceMap).map(
        ([prop, province]) => {
          const currentVal = (data?.dateRangeData?.[
            prop as keyof PageAggregatedData
          ] || 0) as number;
          const previousVal = (data?.comparisonDateRangeData?.[
            prop as keyof PageAggregatedData
          ] || 0) as number;

          const change =
            previousVal === 0 ? 0 : (currentVal - previousVal) / previousVal;

          return {
            province: this.i18n.service.translate(province, lang),
            value: currentVal,
            change,
          };
        }
      );

      const isZero = dataByLocation.every((v) => v.value === 0);

      if (isZero) {
        return [];
      }

      return dataByLocation;
    })
  );

  // topPagesVisitedWithPercentChange$ = this.pagesDetailsData$.pipe(
  //   mapObjectArraysWithPercentChange('root', 'visits')
  // );

  dyfData$ = combineLatest([this.pagesDetailsData$, this.currentLang$]).pipe(
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

  whatWasWrongData$ = combineLatest([
    this.pagesDetailsData$,
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

  topSearchTermsIncrease$ = this.pagesDetailsData$.pipe(
    map((data) => [...(data?.topSearchTermsIncrease || [])])
  );

  topSearchTermsDecrease$ = this.pagesDetailsData$.pipe(
    map((data) => [...(data?.topSearchTermsDecrease || [])])
  );

  top25GSCSearchTerms$ = this.pagesDetailsData$.pipe(
    map(
      (data) =>
        [...(data?.top25GSCSearchTerms || [])] as (GscSearchTermMetrics & {
          change: number;
        })[]
    )
  );

  feedbackComments$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackComments = data?.feedbackComments?.map((d) => ({
        date: d.date,
        tag: d.tag && this.i18n.service.translate(d.tag, lang),
        whats_wrong: d.whats_wrong
          ? this.i18n.service.translate(d.whats_wrong, lang)
          : d.whats_wrong,
        comment: d.comment,
      }));
      return [...(feedbackComments || [])];
    })
  );

  feedbackByTagsBarChart$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackByTags = data.dateRangeData?.feedbackByTags || [];
      const feedbackByTagsPrevious =
        data.comparisonDateRangeData?.feedbackByTags || [];

      const isCurrZero = feedbackByTags.every((v) => v.numComments === 0);
      const isPrevZero = feedbackByTagsPrevious.every(
        (v) => v.numComments === 0
      );

      if (isCurrZero && isPrevZero) {
        return [] as MultiSeries;
      }

      const dateRange = data.dateRange;
      const comparisonDateRange = data.comparisonDateRange;

      const currentSeries = {
        name: getWeeklyDatesLabel(dateRange, lang),
        series: feedbackByTags.map((feedback) => ({
          name: this.i18n.service.translate(`${feedback.tag}`, lang),
          value: feedback.numComments,
        })),
      };

      const previousSeries = {
        name: getWeeklyDatesLabel(comparisonDateRange || '', lang),
        series: feedbackByTagsPrevious.map((feedback) => ({
          name: this.i18n.service.translate(`${feedback.tag}`, lang),
          value: feedback.numComments,
        })),
      };

      return [currentSeries, previousSeries];
    })
  );

  feedbackByTagsTable$ = combineLatest([
    this.pagesDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackByTags = data.dateRangeData?.feedbackByTags || [];
      const feedbackByTagsPrevious =
        data.comparisonDateRangeData?.feedbackByTags || [];

      const allUniqueTags = [
        ...new Set([
          ...feedbackByTags.map((d) => d.tag),
          ...feedbackByTagsPrevious.map((d) => d.tag),
        ]),
      ];

      return allUniqueTags.map((tag) => {
        const currValue =
          feedbackByTags.find((feedback) => feedback.tag === tag)
            ?.numComments || 0;
        const prevValue =
          feedbackByTagsPrevious.find((feedback) => feedback.tag === tag)
            ?.numComments || 0;

        return {
          tag: this.i18n.service.translate(tag, lang),
          currValue,
          prevValue,
        };
      });
    })
  );

  error$ = this.store.select(PagesDetailsSelectors.selectPagesDetailsError);

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(PagesDetailsActions.loadPagesDetailsInit());
  }
}

const getMonthlyDays = (date: Date) => {
  return dayjs(date).utc(false).daysInMonth();
};

type DateRangeDataIndexKey = keyof PageAggregatedData &
  keyof PickByType<PageAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<PageAggregatedData, number>
) {
  return map((data: PageDetailsData) => {
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

const getWeeklyDatesLabel = (dateRange: string, lang: LocaleId) => {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateFormat = lang === 'fr-CA' ? 'D MMM' : 'MMM D';

  const formattedStartDate = dayjs
    .utc(startDate)
    .locale(lang)
    .format(dateFormat);
  const formattedEndDate = dayjs.utc(endDate).locale(lang).format(dateFormat);

  return `${formattedStartDate}-${formattedEndDate}`;
};

function mapObjectArraysWithPercentChange(
  propName: keyof PageAggregatedData,
  propPath: string
) {
  return map((data: PageDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = data?.dateRangeData[propName];
    const previous = data?.comparisonDateRangeData[propName];

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
