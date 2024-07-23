import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';
import { I18nFacade, selectRoute } from '@dua-upd/upd/state';
import { FR_CA, type LocaleId } from '@dua-upd/upd/i18n';
import type {
  AttachmentData,
  TaskDetailsMetrics,
  TaskDetailsData,
  VisitsByPage,
} from '@dua-upd/types-common';
import {
  type GetTableProps,
  type KeysOfType,
  percentChange,
  type PickByType,
  type UnwrapObservable,
  logJson,
  arrayToDictionary,
} from '@dua-upd/utils-common';
import * as TasksDetailsActions from './tasks-details.actions';
import * as TasksDetailsSelectors from './tasks-details.selectors';
import { createColConfigWithI18n } from '@dua-upd/upd/utils';
import type {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
} from 'ng-apexcharts';
import {
  selectCallsPerVisitsChartData,
  selectDyfNoPerVisitsSeries,
  selectTasksDetailsDataWithI18n,
} from './tasks-details.selectors';

dayjs.extend(utc);

type CallsByTopicTableType = GetTableProps<TasksDetailsFacade, 'callsByTopic$'>;

@Injectable()
export class TasksDetailsFacade {
  private i18n = inject(I18nFacade);
  private readonly store = inject(Store);

  loaded$ = this.store.select(TasksDetailsSelectors.selectTasksDetailsLoaded);
  loading$ = this.store.select(TasksDetailsSelectors.selectTasksDetailsLoading);
  tasksDetailsData$ = this.store.select(
    TasksDetailsSelectors.selectTasksDetailsData,
  );

  currentLang$ = this.i18n.currentLang$;

  currentRoute$ = this.store.select(selectRoute);

  titleHeader$ = this.getTranslatedProp('title');

  detailsTable$ = this.store.select(selectTasksDetailsDataWithI18n).pipe(
    map(([data, lang]) => {
      const detailsFieldNames = [
        'group',
        'subgroup',
        'topic',
        'subtopic',
        'channel',
        'core',
        'program',
        'service',
        'user_journey',
        'status',
        'user_type',
      ] as const;

      return detailsFieldNames.map((fieldName) => {
        const value = data?.[fieldName];

        if (Array.isArray(value)) {
          return [
            this.i18n.service.translate(fieldName, lang),
            value
              .map((valItem) => this.i18n.service.translate(valItem, lang))
              .join(', '),
          ];
        }

        return [
          this.i18n.service.translate(fieldName, lang),
          value ? this.i18n.service.translate(value, lang) : value,
        ];
      });
    }),
  );

  avgTaskSuccessFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgTaskSuccessFromLastTest),
  );

  avgSuccessPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgSuccessPercentChange),
  );

  avgSuccessValueChange$ = this.tasksDetailsData$.pipe(
    map((data) => data.avgSuccessValueChange),
  );

  dateFromLastTest$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.dateFromLastTest
        ? new Date(data?.dateFromLastTest)
        : data?.dateFromLastTest,
    ),
  );

  visits$ = this.tasksDetailsData$.pipe(map((data) => data?.visits || 0));
  visitsPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.visitsPercentChange),
  );
  
  visitsByPage$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const { feedbackByPage } = data;
      const feedbackByPageDict = arrayToDictionary(feedbackByPage || [], '_id');

      return data?.visitsByPage?.map((visitsByPage) => {
        const feedback = feedbackByPageDict[visitsByPage._id];

        return {
          ...visitsByPage,
          sum: feedback.sum || 0,
          commentsPercentChange: feedback.percentChange || null,
        };
      });
    }),
  );

  feedbackByDay$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const feedbackByDayData = data?.feedbackByDay || [];

      return feedbackByDayData.every((v) => v.sum === 0)
        ? []
        : feedbackByDayData;
    }),
  );

  apexCallDrivers$ = this.store.select(selectCallsPerVisitsChartData);
  apexKpiFeedback$ = this.store.select(selectDyfNoPerVisitsSeries);

  comparisonVisits$ = this.tasksDetailsData$.pipe(
    map((data) => data?.comparisonDateRangeData?.visits || 0),
  );

  totalCalldriver$ = this.tasksDetailsData$.pipe(
    map((data) => data?.dateRangeData?.totalCalldrivers || 0),
  );

  comparisonTotalCalldriver$ = this.tasksDetailsData$.pipe(
    map((data) => data?.comparisonDateRangeData?.totalCalldrivers || 0),
  );

  totalCalldriverPercentChange$ = this.tasksDetailsData$.pipe(
    mapToPercentChange('totalCalldrivers'),
  );

  callPerVisits$ = combineLatest([this.totalCalldriver$, this.visits$]).pipe(
    map(([currentCalls, visits]) => {
      return currentCalls / visits;
    }),
  );

  callComparisonPerVisits$ = combineLatest([
    this.comparisonTotalCalldriver$,
    this.comparisonVisits$,
  ]).pipe(
    map(([comparisonCalls, comparisonVisits]) => {
      return comparisonCalls / comparisonVisits;
    }),
  );

  apexCallPercentChange$ = combineLatest([
    this.callPerVisits$,
    this.callComparisonPerVisits$,
  ]).pipe(
    map(([currentCalls, comparisonVisits]) =>
      percentChange(currentCalls, comparisonVisits),
    ),
  );

  apexCallDifference$ = combineLatest([
    this.callPerVisits$,
    this.callComparisonPerVisits$,
  ]).pipe(
    map(([currentCalls, comparisonVisits]) => currentCalls - comparisonVisits),
  );

  currentKpiFeedback$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const dyfNoCurrent = data?.dateRangeData?.dyfNo || 0;
      const visits = data?.dateRangeData?.visits || 0;

      return dyfNoCurrent / visits;
    }),
  );

  comparisonKpiFeedback$ = combineLatest([this.tasksDetailsData$]).pipe(
    map(([data]) => {
      const dyfNoComparison = data?.comparisonDateRangeData?.dyfNo || 0;
      const visits = data?.comparisonDateRangeData?.visits || 0;

      return dyfNoComparison / visits;
    }),
  );

  kpiFeedbackPercentChange$ = combineLatest([
    this.currentKpiFeedback$,
    this.comparisonKpiFeedback$,
  ]).pipe(
    map(([currentKpi, comparisonKpi]) =>
      percentChange(currentKpi, comparisonKpi),
    ),
  );

  kpiFeedbackDifference$ = combineLatest([
    this.currentKpiFeedback$,
    this.comparisonKpiFeedback$,
  ]).pipe(map(([currentKpi, comparisonKpi]) => currentKpi - comparisonKpi));

  projects$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      return (
        data?.projects?.map((d) => ({
          id: d.id,
          title: this.i18n.service.translate(d.title, lang),
        })) || []
      );
    }),
  );

  documents$ = this.tasksDetailsData$.pipe(
    map((data) =>
      data?.projects
        .reduce(
          (attachments, project) => [
            ...attachments,
            ...(project.attachments || []),
          ],
          [] as AttachmentData[],
        )
        .map((attachment) => ({
          url: attachment.storage_url,
          filename: attachment.filename,
        })),
    ),
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
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang),
    ),
  );

  fullDateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getFullDateRangeLabel(data.dateRange, lang)));

  fullComparisonDateRangeLabel$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getFullDateRangeLabel(data.comparisonDateRange || '', lang),
    ),
  );

  calldriversChart$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateRangeLabel = getWeeklyDatesLabel(data.dateRange || '', lang);
      const comparisonDateRangeLabel = getWeeklyDatesLabel(
        data.comparisonDateRange || '',
        lang,
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
        (v) => v.value > 0,
      );

      const barChartData = [
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
    }),
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
    }),
  );

  apexCalldriversChart$ = combineLatest([this.calldriversTable$]).pipe(
    map(([data]) => {
      return data.map((d) => {
        return {
          name: d.name,
          data: [d.currValue, d.prevValue],
        };
      });
    }),
  );

  dyfData$ = combineLatest([this.tasksDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const currYesVal = data?.dateRangeData?.dyfYes || 0;
      const prevYesVal = data?.comparisonDateRangeData?.dyfYes || NaN;
      const currNoVal = data?.dateRangeData?.dyfNo || 0;
      const prevNoVal = data?.comparisonDateRangeData?.dyfNo || NaN;

      const pieChartData = [
        { name: yes, currValue: currYesVal, prevValue: prevYesVal },
        { name: no, currValue: currNoVal, prevValue: prevNoVal },
      ];

      const filteredPieChartData = pieChartData.filter(
        (v) => v.currValue > 0 || v.prevValue > 0,
      );

      return filteredPieChartData.length > 0 ? filteredPieChartData : [];
    }),
  );

  dyfDataApex$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dyfData: ApexAxisChartSeries = [
        {
          name: this.i18n.service.translate('yes', lang),
          data: [
            data?.dateRangeData?.dyfYes || 0,
            data?.comparisonDateRangeData?.dyfYes || 0,
          ],
        },
        {
          name: this.i18n.service.translate('no', lang),
          data: [
            data?.dateRangeData?.dyfNo || 0,
            data?.comparisonDateRangeData?.dyfNo || 0,
          ],
        },
      ];

      const isZero = dyfData.every((item) =>
        (item.data as number[]).every(
          (value) => typeof value === 'number' && value === 0,
        ),
      );

      if (isZero) {
        return [];
      }

      return dyfData;
    }),
  );

  callsByTopic$ = this.tasksDetailsData$.pipe(
    map((data) => {
      if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
        return null;
      }
      const comparisonData = data?.comparisonDateRangeData?.callsByTopic || [];

      return (data?.dateRangeData?.callsByTopic || []).map((callsByTopic) => {
        const previousCalls = comparisonData.find(
          (prevTopic) => prevTopic.tpc_id === callsByTopic.tpc_id,
        );

        return {
          topic: callsByTopic.topic || '',
          tpc_id: callsByTopic.tpc_id || '',
          enquiry_line: callsByTopic.enquiry_line || '',
          subtopic: callsByTopic.subtopic || '',
          sub_subtopic: callsByTopic.sub_subtopic || '',
          calls: callsByTopic.calls,
          comparison: !previousCalls?.calls
            ? Infinity
            : percentChange(callsByTopic.calls, previousCalls.calls),
        };
      });
    }),
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
        field: 'tpc_id',
        header: 'tpc_id',
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
        field: 'enquiry_line',
        header: 'enquiry_line',
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
    ],
  );

  currentCallVolume$ = this.tasksDetailsData$.pipe(
    map(
      (data) =>
        data?.dateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.calls,
          0,
        ) || 0,
    ),
  );

  comparisonCallVolume$ = this.tasksDetailsData$.pipe(
    map(
      (data) =>
        data?.comparisonDateRangeData?.calldriversEnquiry.reduce(
          (totalCalls, enquiryLineCalls) => totalCalls + enquiryLineCalls.calls,
          0,
        ) || 0,
    ),
  );
  callPercentChange$ = combineLatest([
    this.currentCallVolume$,
    this.comparisonCallVolume$,
  ]).pipe(
    map(([currentCalls, comparisonCalls]) =>
      percentChange(currentCalls, comparisonCalls),
    ),
  );

  taskSuccessChart$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0,
      );

      if (!taskSuccessByUxTest || !tasksWithSuccessRate.length) {
        return [];
      }

      return taskSuccessByUxTest.map(({ title, success_rate }, idx) => ({
        name: `UX Test: ${idx + 1} - ${title}`,
        value: success_rate || 0,
      }));
    }),
  );

  taskSuccessChartData$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0,
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
    }),
  );

  taskSuccessChartLegend$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const taskSuccessByUxTest = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxTest?.filter(
        (task) => task.success_rate || task.success_rate === 0,
      );

      if (!taskSuccessByUxTest || !tasksWithSuccessRate.length) {
        return [];
      }

      const name: string[] = [];

      taskSuccessByUxTest.map(({ title, success_rate }, idx) => {
        name.push(`UX Test: ${idx + 1} - ${title}`);
      });

      return name;
    }),
  );

  gscTotalClicks$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalClicks || 0),
  );
  gscTotalClicksPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalClicksPercentChange),
  );

  gscTotalImpressions$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalImpressions || 0),
  );
  gscTotalImpressionsPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalImpressionsPercentChange),
  );

  gscTotalCtr$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalCtr || 0),
  );
  gscTotalCtrPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalCtrPercentChange),
  );

  gscTotalPosition$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalPosition || 0),
  );
  gscTotalPositionPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.gscTotalPositionPercentChange),
  );

  taskSuccessByUxTest$ = combineLatest([
    this.tasksDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM DD, YYYY';

      const uxTests = data?.taskSuccessByUxTest;

      const maxTotalUsersByTitle = uxTests.reduce<Record<string, number>>(
        (acc, test) => {
          acc[test.title] = Math.max(
            acc[test.title] || 0,
            test.total_users || 0,
          );
          return acc;
        },
        {},
      );

      const totalSum = Object.values(maxTotalUsersByTitle).reduce(
        (sum, val) => sum + val,
        0,
      );

      const taskSuccessByUxTest = uxTests?.map((d) => ({
        ...d,
        title: d.title ? this.i18n.service.translate(d.title, lang) : d.title,
        test_type: d.test_type
          ? this.i18n.service.translate(d.test_type, lang)
          : d.test_type,
        date: d.date,
        total_users: totalSum,
      }));
      return [...(taskSuccessByUxTest || [])];
    }),
  );


  

  totalParticipants$ = this.tasksDetailsData$.pipe(
    map((data) => {
      const uxTests = data?.taskSuccessByUxTest || [];
  
      // Initialize accumulators for validation and non-validation tests
      const maxTotalUsersByValidation = uxTests.reduce<Record<string, number>>(
        (acc, test) => {
          if (test.test_type === 'Validation') {
            acc[test.title] = Math.max(
              acc[test.title] || 0,
              test.total_users || 0,
            );
          }
          return acc;
        },
        {},
      );
  
      const maxTotalUsersByNonValidation = uxTests.reduce<Record<string, number>>(
        (acc, test) => {
          if (test.test_type !== 'Validation') {
            acc[test.title] = Math.max(
              acc[test.title] || 0,
              test.total_users || 0,
            );
          }
          return acc;
        },
        {},
      );
  
      // Log the maxTotalUsersByTitle for debugging
      console.log('maxTotalUsersByValidation:', maxTotalUsersByValidation);
      console.log('maxTotalUsersByNonValidation:', maxTotalUsersByNonValidation);
  
      // Calculate and sum the total users for both categories
      const validationSum = Object.values(maxTotalUsersByValidation).reduce(
        (sum, val) => sum + val,
        0,
      );
  
      const nonValidationSum = Object.values(maxTotalUsersByNonValidation).reduce(
        (sum, val) => sum + val,
        0,
      );
  
      // Return the combined sum of both accumulators
      return validationSum + nonValidationSum;
    }),
  );
  
  

  feedbackTotalComments$ = this.tasksDetailsData$.pipe(
    map((data) => data?.numComments || 0),
  );
  
  feedbackTotalCommentsPercentChange$ = this.tasksDetailsData$.pipe(
    map((data) => data?.numCommentsPercentChange),
  );

  topSearchTerms$ = this.tasksDetailsData$.pipe(
    map((data) => data?.searchTerms),
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

  feedbackMostRelevant = this.store.selectSignal(
    TasksDetailsSelectors.selectFeedbackMostRelevant,
  );

  getMostRelevantFeedback() {
    this.store.dispatch(TasksDetailsActions.getMostRelevantFeedback());
  }

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(TasksDetailsActions.loadTasksDetailsInit());
  }

  getTranslatedProp(propName: KeysOfType<TaskDetailsData, string>) {
    return this.store
      .select(selectTasksDetailsDataWithI18n)
      .pipe(
        map(([data, lang]) =>
          data[propName]
            ? this.i18n.service.translate(data[propName], lang)
            : data[propName],
        ),
      );
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
type DateRangeDataIndexKey = keyof TaskDetailsMetrics &
  keyof PickByType<TaskDetailsMetrics, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<TaskDetailsMetrics, number>,
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
  propName: keyof TaskDetailsMetrics,
  propPath: string,
  sortPath?: string,
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
          (previous as any)[i][propPath],
        ),
      }));
    }

    return [];
  });
}

function mapPageMetricsArraysWithPercentChange(
  propName: keyof TaskDetailsMetrics,
  propPath: string,
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
      {} as { [pageId: string]: Record<string, number> },
    );

    const previousMetricsByPage = previous.reduce(
      (metricsByPage, page: VisitsByPage) => {
        metricsByPage[page._id] = {
          ...page,
        };

        return metricsByPage;
      },
      {} as { [pageId: string]: Record<string, number> },
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

const getFullDateRangeLabel = (dateRange: string, lang: LocaleId) => {
  const [startDate, endDate] = dateRange.split('/');

  const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM D YYYY';
  const separator = lang === FR_CA ? ' au' : ' to';

  const formattedStartDate = dayjs
    .utc(startDate)
    .locale(lang)
    .format(dateFormat);

  const formattedEndDate = dayjs.utc(endDate).locale(lang).format(dateFormat);

  return [`${formattedStartDate}${separator}`, `${formattedEndDate}`];
};
