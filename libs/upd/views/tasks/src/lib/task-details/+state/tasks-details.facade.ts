import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';

import { I18nFacade, selectRoute } from '@dua-upd/upd/state';
import { FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import {
  TaskDetailsAggregatedData,
  TaskDetailsData,
  VisitsByPage,
} from '@dua-upd/types-common';
import {
  GetTableProps,
  percentChange,
  PickByType, UnwrapObservable
} from '@dua-upd/utils-common';
import * as TasksDetailsActions from './tasks-details.actions';
import * as TasksDetailsSelectors from './tasks-details.selectors';
import { createColConfigWithI18n } from '@dua-upd/upd/utils';
import { ApexAxisChartSeries, ApexNonAxisChartSeries } from 'ng-apexcharts';

dayjs.extend(utc);

type CallsByTopicTableType = GetTableProps<TasksDetailsFacade, 'callsByTopic$'>;

@Injectable()
export class TasksDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.select(TasksDetailsSelectors.selectTasksDetailsLoaded);
  loading$ = this.store.select(TasksDetailsSelectors.selectTasksDetailsLoading);
  tasksDetailsData$ = this.store.select(
    TasksDetailsSelectors.selectTasksDetailsData
  );

  currentLang$ = this.i18n.currentLang$;

  currentRoute$ = this.store.select(selectRoute);

  titleHeader$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      data.title ? this.i18n.service.translate(data.title, lang) : data.title
    )
  );

  avgTaskSuccessFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgTaskSuccessFromLastTest)
  );

  dateFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.dateFromLastTest
        ? new Date(data?.dateFromLastTest)
        : data?.dateFromLastTest
    )
  );

  visits$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  visitsByPage$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage)
  );

  visitsByPageWithPercentChange$ = this.tasksDetailsData$.pipe(
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'visits')
  );

  visitsByPageGSCWithPercentChange$ = this.tasksDetailsData$.pipe(
    mapObjectArraysWithPercentChange('visitsByPage', 'gscTotalClicks', '_id')
  );

  visitsByPageFeedbackWithPercentChange$ = this.tasksDetailsData$.pipe(
    map((data): TaskDetailsData => {
      if (data.dateRangeData?.visitsByPage) {
        // data object is immutable, so we need to make a deep copy
        // -> fastest and easiest way is to serialize/deserialize with JSON methods
        const newData = JSON.parse(JSON.stringify(data));

        newData.dateRangeData.visitsByPage =
          data.dateRangeData.visitsByPage.map((page) => {
            if (page.visits === 0) {
              return page;
            }

            const totalFeedback = (page.dyfYes || 0) + (page.dyfNo || 0);

            if (totalFeedback === 0) {
              return page;
            }

            return {
              ...page,
              feedbackToVisitsRatio: totalFeedback / page.visits,
            };
          });

        return newData;
      }

      return data;
    }),
    mapObjectArraysWithPercentChange('visitsByPage', 'dyfNo', '_id')
  );

  projects$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      return (
        data?.projects?.map((d) => ({
          id: d.id,
          title: this.i18n.service.translate(d.title, lang),
        })) || []
      );
    })
  );

  documents$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.taskSuccessByUxTest
        .map((d) => {
          return d.attachments.map((a) => {
            const url = a.url.replace('https://', '');
            return {
              filename: a.filename,
              url: url,
            };
          });
        })
        .flat()
    )
  );

  dateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang)));

  comparisonDateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  calldriversChart$ = combineLatest([
    this.tasksDetailsData$,
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
        value: d.calls,
      }));

      const comparisonDataEnquiryLine = (
        data?.comparisonDateRangeData?.calldriversEnquiry || []
      ).map((d) => ({
        name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
        value: d.calls,
      }));

      const isCurrZero = dataEnquiryLine.every((v) => v.value === 0);
      const isPrevZero = comparisonDataEnquiryLine.every((v) => v.value === 0);

      if (isCurrZero && isPrevZero) {
        return [];
      }

      const dataEnquiryLineFinal = dataEnquiryLine.filter((v) => v.value > 0);
      const comparisonDataEnquiryLineFinal = comparisonDataEnquiryLine.filter(
        (v) => v.value > 0
      );

      const barChartData  = [
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
    this.tasksDetailsData$,
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
            prevVal = cd.calls;
          }
        });
        return {
          name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
          currValue: d.calls,
          prevValue: prevVal,
        };
      });

      comparisonDateRange.map((d) => {
        let currVal = 0;
        dateRange.map((cd) => {
          if (d.enquiry_line === cd.enquiry_line) {
            currVal = cd.calls;
          }
        });
        if (currVal === 0) {
          dataEnquiryLine.push({
            name: this.i18n.service.translate(`d3-${d.enquiry_line}`, lang),
            currValue: 0,
            prevValue: d.calls,
          });
        }
      });
      return dataEnquiryLine.filter((v) => v.currValue > 0 || v.prevValue > 0);
    })
  );

  apexCalldriversChart$ = combineLatest([this.calldriversTable$]).pipe(
    map(([data]) => {
      return data.map((d) => {
        return {
          name: d.name,
          data: [d.currValue, d.prevValue],
        };
      });
    })
  );

  dyfDataApex$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const pieChartData: any = [
        data?.dateRangeData?.dyfYes || 0,
        data?.dateRangeData?.dyfNo || 0,
      ] as ApexNonAxisChartSeries;

      const isZero = pieChartData.every((v: number) => v === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongDataApex$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const pieChartData = [
        data?.dateRangeData?.fwylfCantFindInfo || 0,
        data?.dateRangeData?.fwylfOther || 0,
        data?.dateRangeData?.fwylfHardToUnderstand || 0,
        data?.dateRangeData?.fwylfError || 0,
      ] as ApexNonAxisChartSeries;

      const isZero = pieChartData.every((v) => v === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  callsByTopic$ = this.tasksDetailsData$.pipe(
    map((data) => {
      if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
        return null;
      }
      const comparisonData = data?.comparisonDateRangeData?.callsByTopic || [];

      return (data?.dateRangeData?.callsByTopic || []).map((callsByTopic) => {
        const previousCalls = comparisonData.find(
          (prevTopic) => prevTopic.tpc_id === callsByTopic.tpc_id
        );

        return {
          topic: `${callsByTopic.tpc_id}.topic`,
          subtopic: `${callsByTopic.tpc_id}.sub-topic`,
          sub_subtopic: `${callsByTopic.tpc_id}.sub-subtopic`,
          calls: callsByTopic.calls,
          comparison: !previousCalls?.calls
            ? Infinity
            : percentChange(callsByTopic.calls, previousCalls.calls),
        };
      });
    })
  );

  callsByTopicConfig$ = createColConfigWithI18n<CallsByTopicTableType>(
    this.i18n.service,
    [
      {
        field: 'topic',
        header: 'topic',
        translate: true,
      },
      {
        field: 'subtopic',
        header: 'sub-topic',
        translate: true,
      },
      {
        field: 'sub_subtopic',
        header: 'sub-subtopic',
        translate: true,
      },
      {
        field: 'calls',
        header: 'calls',
        pipe: 'number',
      },
      {
        field: 'comparison',
        header: 'comparison',
        pipe: 'percent',
      },
    ]
  );

  currentCallVolume$ = this.tasksDetailsData$.pipe(
    map(
      (data) =>
        data?.dateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.calls,
          0
        ) || 0
    )
  );

  comparisonCallVolume$ = this.tasksDetailsData$.pipe(
    map(
      (data) =>
        data?.comparisonDateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.calls,
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

  dyfData$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const pieChartData = [
        { name: yes, value: data?.dateRangeData?.dyfYes || 0 },
        { name: no, value: data?.dateRangeData?.dyfNo || 0 },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  whatWasWrongData$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
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

      const pieChartData = [
        {
          name: cantFindInfo,
          value: data?.dateRangeData?.fwylfCantFindInfo || 0,
        },
        { name: otherReason, value: data?.dateRangeData?.fwylfOther || 0 },
        {
          name: hardToUnderstand,
          value: data?.dateRangeData?.fwylfHardToUnderstand || 0,
        },
        {
          name: error,
          value: data?.dateRangeData?.fwylfError || 0,
        },
      ];

      const isZero = pieChartData.every((v) => v.value === 0);
      if (isZero) {
        return [];
      }

      return pieChartData;
    })
  );

  taskSuccessChart$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0
      );

      if (!taskSuccessByUxTest || !tasksWithSuccessRate.length) {
        return [];
      }

      return taskSuccessByUxTest.map(({ title, success_rate }, idx) => ({
        name: `UX Test: ${idx + 1} - ${title}`,
        value: success_rate || 0,
      }));
    })
  );

  taskSuccessChartData$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0
      );

      if (!taskSuccessByUxTest || !tasksWithSuccessRate.length) {
        return [];
      }

      const ajax: number[] = [];

      taskSuccessByUxTest.map(({ title, success_rate }, idx) => {
        ajax.push(success_rate || 0);
      });
      return [
        {
          data: ajax,
        },
      ] as ApexAxisChartSeries;
    })
  );

  taskSuccessChartLegend$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0
      );

      if (!taskSuccessByUxTest || !tasksWithSuccessRate.length) {
        return [];
      }

      const name: string[] = [];

      taskSuccessByUxTest.map(({ title, success_rate }, idx) => {
        name.push(`UX Test: ${idx + 1} - ${title}`);
      });

      return name;
    })
  );

  gscTotalClicks$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks || 0)
  );
  gscTotalClicksPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks')
  );

  gscTotalImpressions$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions || 0)
  );
  gscTotalImpressionsPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions')
  );

  gscTotalCtr$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr || 0)
  );
  gscTotalCtrPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr')
  );

  gscTotalPosition$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition || 0)
  );
  gscTotalPositionPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition')
  );

  taskSuccessByUxTest$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM DD, YYYY';
      const taskSuccessByUxTest = data?.taskSuccessByUxTest?.map((d) => ({
        ...d,
        title: d.title ? this.i18n.service.translate(d.title, lang) : d.title,
        test_type: d.test_type
          ? this.i18n.service.translate(d.test_type, lang)
          : d.test_type,
        date: d.date,
      }));
      return [...(taskSuccessByUxTest || [])];
    })
  );

  totalParticipants$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.taskSuccessByUxTest
        ?.map((data) => data?.total_users)
        .reduce((a, b) => (a || 0) + (b || 0), 0)
    )
  );

  feedbackComments$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackComments = data?.feedbackComments?.map((d) => ({
        ...d,
        date: d.date,
        tag: d.tag && this.i18n.service.translate(d.tag, lang),
        whats_wrong: d.whats_wrong
          ? this.i18n.service.translate(d.whats_wrong, lang)
          : d.whats_wrong,
      }));
      return [...(feedbackComments || [])];
    })
  );

  feedbackByTagsBarChart$ = combineLatest([
    this.tasksDetailsData$,
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
        return [];
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
    this.tasksDetailsData$,
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

  apexFeedbackByTagsTable$ = combineLatest([this.feedbackByTagsTable$]).pipe(
    map(([data]) => {
      return data.map((d) => {
        return {
          name: d.tag,
          data: [d.currValue, d.prevValue],
        };
      }) as ApexAxisChartSeries;
    })
  );

  topSearchTerms$ = this.tasksDetailsData$.pipe(
    map((data) => data?.searchTerms)
  );

  searchTermsColConfig$ = createColConfigWithI18n<
    UnwrapObservable<typeof this.topSearchTerms$>
  >(this.i18n.service, [
    { field: 'term', header: 'search-term' },
    { field: 'clicks', header: 'clicks', pipe: 'number' },
    { field: 'clicksChange', header: 'comparison-for-clicks', pipe: 'percent' },
    {
      field: 'position',
      header: 'position',
      pipe: 'number',
      pipeParam: '1.0-2',
    },
  ]);

  error$ = this.store.select(TasksDetailsSelectors.selectTasksDetailsError);

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksDetailsActions.loadTasksDetailsInit());
  }
}

const getWeeklyDatesLabel = (dateRange: string, lang: LocaleId) => {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const dateFormat = lang === FR_CA ? 'D MMM' : 'MMM D';

  const formattedStartDate = dayjs(startDate)
    .utc(false)
    .locale(lang)
    .format(dateFormat);
  const formattedEndDate = dayjs(endDate)
    .utc(false)
    .locale(lang)
    .format(dateFormat);

  return `${formattedStartDate}-${formattedEndDate}`;
};
type DateRangeDataIndexKey = keyof TaskDetailsAggregatedData &
  keyof PickByType<TaskDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<TaskDetailsAggregatedData, number>
) {
  return map((data: TaskDetailsData) => {
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
  propName: keyof TaskDetailsAggregatedData,
  propPath: string,
  sortPath?: string
) {
  return map((data: TaskDetailsData) => {
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

    return [];
  });
}

function mapPageMetricsArraysWithPercentChange(
  propName: keyof TaskDetailsAggregatedData,
  propPath: string
) {
  return map((data: TaskDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = [...((data?.dateRangeData?.[propName] || []) as any[])];
    const previous = [
      ...((data?.comparisonDateRangeData?.[propName] || []) as any[]),
    ];

    const currentMetricsByPage = current.reduce(
      (metricsByPage, page: VisitsByPage) => {
        metricsByPage[page._id] = {
          ...page,
        };

        return metricsByPage;
      },
      {} as { [pageId: string]: Record<string, number> }
    );

    const previousMetricsByPage = previous.reduce(
      (metricsByPage, page: VisitsByPage) => {
        metricsByPage[page._id] = {
          ...page,
        };

        return metricsByPage;
      },
      {} as { [pageId: string]: Record<string, number> }
    );

    return Object.keys(currentMetricsByPage).map((pageId: string) => {
      const currentMetrics = currentMetricsByPage[pageId];
      const previousMetrics = previousMetricsByPage[pageId];

      return {
        ...currentMetrics,
        percentChange: previousMetrics
          ? percentChange(currentMetrics[propPath], previousMetrics[propPath])
          : null,
      };
    });
  });
}
