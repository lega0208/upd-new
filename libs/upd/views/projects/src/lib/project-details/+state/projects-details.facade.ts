import { inject, Injectable } from '@angular/core';
import type {
  CalldriversTableRow,
  ColumnConfig,
  ProjectDetailsAggregatedData,
  ProjectsDetailsData,
  TaskKpi,
  VisitsByPage,
} from '@dua-upd/types-common';
import { FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade, selectUrl } from '@dua-upd/upd/state';
import {
  createCategoryConfig,
  createColConfigWithI18n,
} from '@dua-upd/upd/utils';

import {
  avg,
  type GetTableProps,
  percentChange,
  type PickByType,
  type UnwrapObservable,
  round,
} from '@dua-upd/utils-common';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs/esm';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';
import utc from 'dayjs/esm/plugin/utc';
import type {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
} from 'ng-apexcharts';
import { combineLatest, map } from 'rxjs';
import * as ProjectsDetailsActions from './projects-details.actions';
import * as ProjectsDetailsSelectors from './projects-details.selectors';
import {
  selectCallsPerVisitsChartData,
  selectDyfNoPerVisitsSeries,
} from './projects-details.selectors';

dayjs.extend(utc);

type CallsByTopicTableType = GetTableProps<
  ProjectsDetailsFacade,
  'callsByTopic$'
>;

@Injectable()
export class ProjectsDetailsFacade {
  private i18n = inject(I18nFacade);
  private readonly store = inject(Store);

  loaded$ = this.store.select(
    ProjectsDetailsSelectors.selectProjectsDetailsLoaded,
  );

  loading$ = this.store.select(
    ProjectsDetailsSelectors.selectProjectsDetailsLoading,
  );

  projectsDetailsData$ = this.store.select(
    ProjectsDetailsSelectors.selectProjectsDetailsData,
  );

  currentLang$ = this.i18n.currentLang$;

  currentRoute$ = this.store
    .select(selectUrl)
    .pipe(map((url) => url.replace(/\?.+$/, '')));

  title$ = this.projectsDetailsData$.pipe(
    map((data) => data?.title.replace(/\s+/g, ' ')),
  );
  status$ = this.projectsDetailsData$.pipe(map((data) => data?.status));

  cops$ = this.projectsDetailsData$.pipe(map((data) => data?.cops));

  description$ = this.projectsDetailsData$.pipe(
    map((data) => data?.description),
  );

  avgTaskSuccessFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgTaskSuccessFromLastTest),
  );

  avgSuccessPercentChange$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgSuccessPercentChange),
  );

  avgSuccessValueChange$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgSuccessValueChange),
  );

  dateFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) =>
      data?.dateFromLastTest
        ? new Date(data?.dateFromLastTest)
        : data?.dateFromLastTest,
    ),
  );

  totalCalldriver$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.totalCalldrivers || 0),
  );

  comparisonTotalCalldriver$ = this.projectsDetailsData$.pipe(
    map((data) => data?.comparisonDateRangeData?.totalCalldrivers || 0),
  );

  apexCallDrivers$ = this.store.select(selectCallsPerVisitsChartData);
  apexKpiFeedback$ = this.store.select(selectDyfNoPerVisitsSeries);

  visits$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0),
  );
  comparisonVisits$ = this.projectsDetailsData$.pipe(
    map((data) => data?.comparisonDateRangeData?.visits || 0),
  );

  visitsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('visits'),
  );

  visitsByPage$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage),
  );

  visitsByPageWithPercentChange$ = combineLatest([
    this.projectsDetailsData$.pipe(
      mapPageMetricsArraysWithPercentChange('visitsByPage', 'visits'),
    ),
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const visitsByPage = data?.map((page) => {
        const language = page.url.includes('/en/')
          ? this.i18n.service.translate('English', lang)
          : this.i18n.service.translate('French', lang);
        return { ...page, language };
      });

      return [...(visitsByPage || [])];
    }),
  );

  visitsByPageGSCWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'gscTotalClicks'),
  );

  visitsByPageFeedbackWithPercentChange$ = this.projectsDetailsData$.pipe(
    map((data): ProjectsDetailsData => {
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
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'dyfNo'),
  );

  totalCalldriverPercentChange$ = this.projectsDetailsData$.pipe(
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

  currentKpiFeedback$ = this.projectsDetailsData$.pipe(
    map((data) => {
      const dyfNoCurrent = data?.dateRangeData?.dyfNo || 0;
      const visits = data?.dateRangeData?.visits || 0;

      return dyfNoCurrent / visits;
    }),
  );

  comparisonKpiFeedback$ = combineLatest([this.projectsDetailsData$]).pipe(
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

  // this isn't used apparently?
  kpiTaskSuccessByUxTest$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const uxTests = data?.taskSuccessByUxTest.filter(
        (uxTest) => uxTest.success_rate != null,
      );

      const tasksWithSuccessRate = uxTests
        ?.map((uxTest) => uxTest.tasks.split('; ') || [])
        .flat();
      const tasks = data?.tasks.filter((task) =>
        tasksWithSuccessRate.includes(task.title),
      );

      return tasks.map((task) => {
        const relevantTests = uxTests.filter(
          (uxTest) =>
            uxTest.tasks.split('; ').includes(task.title) &&
            uxTest.success_rate != null,
        );

        const latestDate = relevantTests.reduce((latest, test) => {
          return dayjs(latest.date).isAfter(dayjs(test.date)) ? latest : test;
        }).date;

        const latestDateSuccessRates = relevantTests
          .filter(
            (uxTest) =>
              uxTest.date === latestDate &&
              (uxTest.success_rate || uxTest.success_rate === 0),
          )
          .map((uxTest) => uxTest.success_rate) as number[];

        return {
          title: this.i18n.service.translate(task.title, lang),
          success: avg(latestDateSuccessRates, 2),
          latestDate,
        };
      });
    }),
  );

  projectTasks$ = this.projectsDetailsData$.pipe(map((data) => data?.tasks));

  // projectTasks$ = combineLatest([
  //   this.projectsDetailsData$,
  //   this.kpiTaskSuccessByUxTest$,
  //   this.currentLang$,
  // ]).pipe(
  //   map(([data, uxTest, lang]) => {
  //     const tasks = data?.tasks || [];
  //     const callsByTasks = data?.dateRangeData?.callsByTasks || [];
  //     const pageMetricsByTasks = data?.dateRangeData?.pageMetricsByTasks || [];

  //     const callsByTasksDict = arrayToDictionary(callsByTasks, 'title');
  //     const pageMetricsByTasksDict = arrayToDictionary(
  //       pageMetricsByTasks,
  //       'title'
  //     );
  //     const uxTestDict = arrayToDictionary(uxTest, 'title');

  //     return tasks.map((task) => {
  //       const { title } = task;
  //       const { calls = 0 } = callsByTasksDict[title] || {};
  //       const { dyfNo = 0, visits = 0 } = pageMetricsByTasksDict[title] || {};

  //       const kpiNoClicks = visits !== 0 ? (dyfNo / visits) * 1000 : 0;
  //       const kpiCallsRatio = visits !== 0 ? calls / visits : 0;
  //       const kpiCalls = kpiCallsRatio * 100;

  //       const ux = uxTestDict[title] || {};
  //       const uxSuccess = Number(ux.success)?.toFixed(2) || 0;
  //       const uxTest2Years = ux.latestDate;
  //       const isWithin2Years =
  //         uxTest2Years &&
  //         dayjs(uxTest2Years).isAfter(dayjs().subtract(2, 'year'))
  //           ? 'Yes'
  //           : 'No';

  //       return {
  //         ...task,
  //         title: this.i18n.service.translate(title, lang) || title,
  //         calls: kpiCalls,
  //         dyfNo: kpiNoClicks,
  //         uxTest2Years: isWithin2Years,
  //         successRate: uxSuccess,
  //       };
  //     });
  //   })
  // );

  calldriversChart$ = combineLatest([
    this.projectsDetailsData$,
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
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const currentData: { enquiry_line: string; calls: number }[] =
        data?.dateRangeData?.calldriversEnquiry || [];
      const comparisonData: { enquiry_line: string; calls: number }[] =
        data?.comparisonDateRangeData?.calldriversEnquiry || [];

      const callsByEnquiryLine: Record<string, CalldriversTableRow> = {};

      for (const { calls, enquiry_line } of currentData) {
        callsByEnquiryLine[enquiry_line] = {
          enquiry_line,
          currValue: calls,
          prevValue: 0,
        };
      }

      for (const { calls, enquiry_line } of comparisonData) {
        if (!callsByEnquiryLine[enquiry_line]) {
          callsByEnquiryLine[enquiry_line] = {
            enquiry_line,
            currValue: 0,
            prevValue: calls,
          };
        } else {
          callsByEnquiryLine[enquiry_line].prevValue = calls;
        }
      }

      return Object.values(callsByEnquiryLine).map(
        ({ enquiry_line, currValue, prevValue }) => ({
          name: this.i18n.service.translate(`d3-${enquiry_line}`, lang),
          currValue,
          prevValue,
        }),
      );
    }),
  );

  apexCalldriversChart$ = combineLatest([this.calldriversTable$]).pipe(
    map(([data]) => {
      return data.map((d) => ({
        name: d.name,
        data: [d.currValue, d.prevValue],
      }));
    }),
  );

  callsByTopic$ = this.projectsDetailsData$.pipe(
    // callsByTopic$ gets the data from the store and maps it to the callsByTopic property of the ProjectsDetailsData object
    map((data) => {
      if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
        return null;
      }
      const comparisonData = data?.comparisonDateRangeData?.callsByTopic || [];

      return (data?.dateRangeData?.callsByTopic || [])
        .map((callsByTopic) => {
          const previousCalls = comparisonData.find(
            (prevTopic) => prevTopic.tpc_id === callsByTopic.tpc_id,
          );

        return {
          topic: callsByTopic.topic || '',
          tpc_id: callsByTopic.tpc_id || '',
          enquiry_line: callsByTopic.enquiry_line || '',
          tasks: callsByTopic.tasks || [],
          subtopic: callsByTopic.subtopic || '',
          sub_subtopic: callsByTopic.sub_subtopic || '',
          calls: callsByTopic.calls,
          change: !previousCalls?.calls
            ? Infinity
            : percentChange(callsByTopic.calls, previousCalls.calls),
          difference: callsByTopic.calls - (previousCalls?.calls || 0),
        };
      });
    }),
  );

  callsByTopicConfig$ = combineLatest([
    this.callsByTopic$,
  ]).pipe(
    map(([data]) => {
    return [
      {
        field: 'tpc_id',
        header: 'tpc_id',
      },
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
        field: 'enquiry_line',
        header: 'enquiry_line',
        translate: true,
      },
      {
        field: 'tasks',
        header: 'Task',
        translate: true,
        filterConfig: {
          type: 'category',
          categories: data ? createCategoryConfig({
            i18n: this.i18n.service,
            data,
            field: 'tasks',
          }) : [],
        },
      },

      {
        field: 'calls',
        header: 'calls',
        pipe: 'number',
      },
      {
        field: 'change',
        header: 'change',
        pipe: 'percent',
        pipeParam: '1.0-2',
        upGoodDownBad: true,
        indicator: true,
        useArrows: true,
        showTextColours: true,
        secondaryField: {
          field: 'difference',
          pipe: 'number',
        },
        width: '160px',
      },
    ] as ColumnConfig<UnwrapObservable<typeof this.callsByTopic$>>[]
  }),
  );

  dyfDataApex$ = combineLatest([this.projectsDetailsData$, this.currentLang$]).pipe(
    map(([data, lang]) => {
      const dyfData: ApexAxisChartSeries = [
        {
          name: this.i18n.service.translate('yes', lang),
          data: [data?.dateRangeData?.dyfYes || 0, data?.comparisonDateRangeData?.dyfYes || 0],
        },
        {
          name: this.i18n.service.translate('no', lang),
          data: [data?.dateRangeData?.dyfNo || 0, data?.comparisonDateRangeData?.dyfNo || 0],
        },
      ];
  
      const isZero = dyfData.every(item => 
        (item.data as number[]).every(value => typeof value === 'number' && value === 0)
      );
      
      if (isZero) {
        return [];
      }
  
      return dyfData;
    }),
  );

  whatWasWrongDataApex$ = combineLatest([
    this.projectsDetailsData$,
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
    }),
  );

  dyfData$ = combineLatest([this.projectsDetailsData$, this.currentLang$]).pipe(
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
  
      const filteredPieChartData = pieChartData.filter((v) => v.currValue > 0 || v.prevValue > 0);
  
      return filteredPieChartData.length > 0 ? filteredPieChartData : [];
    }),
  );

  whatWasWrongData$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const cantFindInfo = this.i18n.service.translate(
        'd3-cant-find-info',
        lang,
      );
      const otherReason = this.i18n.service.translate('d3-other', lang);
      const hardToUnderstand = this.i18n.service.translate(
        'd3-hard-to-understand',
        lang,
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
    }),
  );

  gscTotalClicks$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks || 0),
  );
  gscTotalClicksPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks'),
  );

  gscTotalImpressions$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions || 0),
  );
  gscTotalImpressionsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions'),
  );

  gscTotalCtr$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr || 0),
  );
  gscTotalCtrPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr'),
  );

  gscTotalPosition$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition || 0),
  );
  gscTotalPositionPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition'),
  );

  taskSuccessByUxTest$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const uxTests = data?.taskSuccessByUxTest;

      if (!uxTests) {
        return [];
      }

      const dateFormat = lang === FR_CA ? 'D MMM YYYY' : 'MMM DD, YYYY';

      const maxTotalUsers = Math.max(
        ...uxTests.map((test) => test.total_users || 0),
      );

      return uxTests.map((uxTest) => {
        return {
          ...uxTest,
          date: dayjs.utc(uxTest.date).locale(lang).format(dateFormat),
          test_type: uxTest.test_type
            ? this.i18n.service.translate(uxTest.test_type, lang)
            : uxTest.test_type,
          tasks: uxTest.tasks
            .split('; ')
            .map((task) =>
              task ? this.i18n.service.translate(task, lang) : task,
            )
            .join('; '),
          total_users: maxTotalUsers,
        };
      });
    }),
  );

  apexTaskSuccessByUxTest$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const uxTests = data?.taskSuccessByUxTest.filter(
        (uxTest) => uxTest.success_rate || uxTest.success_rate === 0,
      );

      const tasksWithSuccessRate = uxTests
        ?.map((uxTest) => uxTest.tasks.split('; ') || [])
        .flat();

      const tasks = data?.tasks.filter(({ title }) =>
        tasksWithSuccessRate.includes(title),
      );

      const categories = tasks.map((task) => task.title);

      const uniqueTestTypes = [
        ...new Set(uxTests.map((item) => item.test_type)),
      ];

      const series = uniqueTestTypes.map((testType) => {
        const data = categories.map((category) => {
          const tasks = uxTests.filter(
            (task) =>
              task.tasks.split('; ').includes(category) &&
              task.test_type === testType &&
              task.success_rate !== null &&
              task.success_rate !== undefined,
          );
          const taskSuccessRates = tasks.map(
            (task) => task.success_rate,
          ) as number[];
          const totalSuccessRates = taskSuccessRates.reduce(
            (acc, val) => acc + val,
            0,
          );
          return tasks.length > 0 ? totalSuccessRates / tasks.length : null;
        }) as number[];

        const name = testType
          ? this.i18n.service.translate(testType as string, lang)
          : testType;

        return { name, data };
      });

      const xaxis = categories.map((category) => {
        return this.i18n.service.translate(category, lang);
      });

      return { series, xaxis };
    }),
  );

  taskSuccessByUxTestKpi$ = combineLatest([
    this.projectsDetailsData$,
    this.projectTasks$, // combined to access tasks id
    this.currentLang$,
  ]).pipe(
    map(([data, projectTasks, lang]) => {
      const uxTests = data?.taskSuccessByUxTest;

      if (!uxTests) {
        return [];
      }

      // get unique tasks from all ux tests and create an array including the avg success rate by task
      const tasks = uxTests
        ?.map((uxTest) => uxTest?.tasks?.split('; '))
        .reduce((acc, val) => acc.concat(val), [])
        .filter((v, i, a) => a.indexOf(v) === i);

      // create an array of success_rate for each test_type and task combination
      const taskSuccess = tasks?.map((task, i) => {
        const successRate = uxTests?.map((uxTest) => {
          const taskSuccessRate = uxTest?.tasks
            ?.split('; ')
            .find((t) => t === task);

          return {
            successRate: taskSuccessRate ? uxTest?.success_rate : null,
            date: uxTest?.date,
            testType: uxTest?.test_type,
          };
        });
        return {
          task,
          date: successRate?.map((v) => v.date),
          success_rate: successRate
            ?.map((success) => {
              return {
                ...success,
              };
            })
            .filter(({ successRate }) => successRate !== null),
        };
      });

      const taskSuccessByUxTestKpi = taskSuccess?.map((task) => {
        const taskSuccessByUxTestKpi = task.success_rate
          ?.map((success) => {
            return {
              test_type: success.testType,
              success_rate: success.successRate,
            };
          })
          .reduce((acc, val) => acc.concat(val), [] as any[])
          .reduce((acc, val) => {
            if (acc[val.test_type]) {
              acc[val.test_type].success_rate += val.success_rate;
              acc[val.test_type].count += 1;
            } else {
              acc[val.test_type] = {
                test_type: val.test_type,
                success_rate: val.success_rate,
                count: 1,
              };
            }
            return acc;
          }, {} as any);

        const taskSuccessByUxTestKpiAvg = Object.keys(
          taskSuccessByUxTestKpi,
        ).map((testType) => {
          const successRate =
            taskSuccessByUxTestKpi[testType].success_rate /
            (taskSuccessByUxTestKpi[testType].count || 1);

          return {
            // test_type: testType,
            // avg_success_rate: successRate,
            [testType]: successRate,
          };
        });

        return {
          _id: projectTasks.find((t) => t.title === task.task)?._id.toString(), // combined from projectTasks
          task: task.task
            ? this.i18n.service.translate(task.task, lang)
            : task.task,
          ...taskSuccessByUxTestKpiAvg.reduce((a, b) => {
            return {
              ...a,
              ...b,
            };
          }, {}),
        } as TaskKpi;
      });

      // divide baseline by validation to get the change in success rate
      return taskSuccessByUxTestKpi?.map((task) => {
        const validation = task.Validation;
        const baseline = task.Baseline;
        const change = (round(validation, 2) - round(baseline, 2)) * 100;
        const taskPercentChange = percentChange(round(validation, 2), round(baseline, 2));

        return {
          ...task,
          change,
          taskPercentChange,
        };
      });
    }),
  );

  totalParticipants$ = this.projectsDetailsData$.pipe(
    map((data) => {
      const uxTests = data?.taskSuccessByUxTest;

      if (!uxTests || !uxTests.length) {
        return 0;
      }

      return Math.max(...uxTests.map((test) => test.total_users || 0));
    }),
  );

  feedbackComments$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackComments = data?.feedbackComments?.map((d) => ({
        ...d,
        date: d.date,
      }));
      return [...(feedbackComments || [])];
    }),
  );

  feedbackTotalComments$ = this.projectsDetailsData$.pipe(
    map((data) => data?.feedbackComments.length || 0),
  );

  commentsPercentChange$ = this.projectsDetailsData$.pipe(
    map((data) => data.feedbackCommentsPercentChange),
  );

  dateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang)));

  comparisonDateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang),
    ),
  );

  fullDateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getFullDateRangeLabel(data.dateRange, lang)));

  fullComparisonDateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getFullDateRangeLabel(data.comparisonDateRange || '', lang),
    ),
  );

  lineTaskChart$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const taskSuccessByUxData = data?.taskSuccessByUxTest;
      const tasksWithSuccessRate = taskSuccessByUxData?.filter(
        (test) => test.success_rate || test.success_rate === 0,
      );

      if (!taskSuccessByUxData || !tasksWithSuccessRate.length) {
        return [];
      }

      const tasks = taskSuccessByUxData
        ?.map((uxTest) => uxTest?.tasks?.split('; '))
        .reduce((acc, val) => acc.concat(val), [])
        .filter((v, i, a) => a.indexOf(v) === i);

      return tasks
        ?.map((task, i) => {
          const successRate = taskSuccessByUxData
            ?.map((uxTest) => {
              const taskSuccessRate = uxTest?.tasks
                ?.split('; ')
                .find((t) => t === task);

              return {
                value: taskSuccessRate ? uxTest?.success_rate : null,
                name: uxTest?.test_type
                  ? this.i18n.service.translate(uxTest.test_type, lang)
                  : '',
                extra: {
                  date: uxTest?.date,
                },
              };
            })
            .filter((v) => v.value !== null && v.value !== undefined)
            .sort((a, b) => {
              if (a.name > b.name) return 1;
              if (a.name < b.name) return -1;
              return 0;
            });
          return {
            task,
            date: successRate?.map((v) => v.extra.date),
            success_rate: successRate
              ?.map((success) => {
                return {
                  ...success,
                };
              })
              .filter(({ value }) => value !== null),
          };
        })
        .map((task) => ({
          name: task.task
            ? this.i18n.service.translate(task.task, lang)
            : task.task,
          series: task.success_rate,
        }))
        .filter((v) => v.name !== null && v.name !== '')
        .sort((a, b) => {
          return a.series.length < b.series.length ? 1 : -1;
        });
    }),
  );

  documents$ = this.projectsDetailsData$.pipe(
    map(
      (data) =>
        data?.attachments.map((attachment) => ({
          url: attachment.storage_url,
          filename: attachment.filename,
        })),
    ),
  );

  topSearchTerms$ = this.projectsDetailsData$.pipe(
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

  startDate$ = this.projectsDetailsData$.pipe(
    map(({ startDate }) => startDate),
  );
  launchDate$ = this.projectsDetailsData$.pipe(
    map(({ launchDate }) => launchDate),
  );
 
  error$ = this.store.select(
    ProjectsDetailsSelectors.selectProjectsDetailsError,
  );

  init() {
    this.store.dispatch(ProjectsDetailsActions.loadProjectsDetailsInit());
  }
}

type DateRangeDataIndexKey = keyof ProjectDetailsAggregatedData &
  keyof PickByType<ProjectDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<ProjectDetailsAggregatedData, number>,
) {
  return map((data: ProjectsDetailsData) => {
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
  propName: keyof ProjectDetailsAggregatedData,
  propPath: string,
  sortPath?: string,
) {
  return map((data: ProjectsDetailsData) => {
    if (!data?.dateRangeData || !data?.comparisonDateRangeData) {
      return;
    }

    const current = [...((data?.dateRangeData?.[propName] || []) as any[])];
    const previous = [
      ...((data?.comparisonDateRangeData?.[propName] || []) as any[]),
    ];

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

    throw Error('Invalid data arrays in mapObjectArraysWithPercentChange');
  });
}
function mapPageMetricsArraysWithPercentChange(
  propName: keyof ProjectDetailsAggregatedData,
  propPath: string,
) {
  return map((data: ProjectsDetailsData) => {
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
