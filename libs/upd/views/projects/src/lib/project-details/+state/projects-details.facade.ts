import {
  BubbleChartMultiSeries,
  MultiSeries,
  SingleSeries,
} from '@amonsour/ngx-charts';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import * as ProjectsDetailsActions from './projects-details.actions';
import { ProjectsDetailsState } from './projects-details.reducer';
import * as ProjectsDetailsSelectors from './projects-details.selectors';
import {
  ProjectDetailsAggregatedData,
  ProjectsDetailsData,
  TaskKpi,
  VisitsByPage,
} from '@cra-arc/types-common';
import { percentChange, PickByType } from '@cra-arc/utils-common';
import { I18nFacade, selectUrl } from '@cra-arc/upd/state';
import dayjs from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import 'dayjs/esm/locale/en-ca';
import 'dayjs/esm/locale/fr-ca';
import { FR_CA, LocaleId } from '@cra-arc/upd/i18n';

dayjs.extend(utc);

@Injectable()
export class ProjectsDetailsFacade {
  /**
   * Combine pieces of state using createSelector,
   * and expose them as observables through the facade.
   */
  loaded$ = this.store.pipe(
    select(ProjectsDetailsSelectors.selectProjectsDetailsLoaded)
  );

  projectsDetailsData$ = this.store.pipe(
    select(ProjectsDetailsSelectors.selectProjectsDetailsData)
  );

  currentLang$ = this.i18n.currentLang$;

  currentRoute$ = this.store.pipe(
    select(selectUrl),
    map((url) => url.replace(/\?.+$/, ''))
  );

  title$ = this.projectsDetailsData$.pipe(
    map((data) => data?.title.replace(/\s+/g, ' '))
  );
  status$ = this.projectsDetailsData$.pipe(map((data) => data?.status));

  avgTaskSuccessFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.avgTaskSuccessFromLastTest)
  );

  dateFromLastTest$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateFromLastTest)
  );

  projectTasks$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const tasks = data?.tasks.map((task) => ({
        ...task,
        title: this.i18n.service.translate(task.title, lang) || task.title,
      }));

      return [...(tasks || [])];
    })
  );

  visits$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visits || 0)
  );
  visitsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('visits')
  );

  visitsByPage$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.visitsByPage)
  );

  visitsByPageWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'visits')
  );

  visitsByPageGSCWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'gscTotalClicks')
  );

  visitsByPageFeedbackWithPercentChange$ = this.projectsDetailsData$.pipe(
    mapPageMetricsArraysWithPercentChange('visitsByPage', 'dyfNo')
  );

  dyfData$ = combineLatest([this.projectsDetailsData$, this.currentLang$]).pipe(
    // todo: utility function for converting to SingleSeries/other chart types
    map(([data, lang]) => {
      const yes = this.i18n.service.translate('yes', lang);
      const no = this.i18n.service.translate('no', lang);

      const pieChartData: SingleSeries = [
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
    this.projectsDetailsData$,
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

  gscTotalClicks$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalClicks || 0)
  );
  gscTotalClicksPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalClicks')
  );

  gscTotalImpressions$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalImpressions || 0)
  );
  gscTotalImpressionsPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalImpressions')
  );

  gscTotalCtr$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalCtr || 0)
  );
  gscTotalCtrPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalCtr')
  );

  gscTotalPosition$ = this.projectsDetailsData$.pipe(
    map((data) => data?.dateRangeData?.gscTotalPosition || 0)
  );
  gscTotalPositionPercentChange$ = this.projectsDetailsData$.pipe(
    mapToPercentChange('gscTotalPosition')
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
              task ? this.i18n.service.translate(task, lang) : task
            )
            .join('; '),
        };
      });
    })
  );
  taskSuccessByUxTestKpi$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
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
          taskSuccessByUxTestKpi
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
      const taskSuccessByUxTestKpiChange = taskSuccessByUxTestKpi?.map(
        (task) => {
          const validation = task.Validation;
          const baseline = task.Baseline;
          const change = validation - baseline;
          let isChange = false;

          if (change >= 0.2) isChange = true;

          return {
            ...task,
            change,
            isChange,
          };
        }
      );

      return taskSuccessByUxTestKpiChange;
    })
  );

  totalParticipants$ = this.projectsDetailsData$.pipe(
    map(
      (data) =>
        data?.taskSuccessByUxTest
          ?.map((data) => data?.total_users)
          .reduce((a = 0, b = 0) => a + b, 0) || 0
    )
  );

  bubbleChart$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const taskSuccessByUxData = data?.taskSuccessByUxTest;

      const taskSeries = taskSuccessByUxData.map(
        ({ success_rate, test_type }) => {
          if (!success_rate && success_rate !== 0) {
            return null;
          }

          const i18nTestType = test_type
            ? this.i18n.service.translate(test_type, lang)
            : '';

          return {
            name: i18nTestType,
            x: i18nTestType,
            y: success_rate,
            r: 10,
          };
        }
      );

      return taskSuccessByUxData
        .map(({ tasks, test_type }, i) => {
          const series = [taskSeries[i]];

          const i18nTestType = test_type
            ? this.i18n.service.translate(test_type, lang)
            : '';

          const i18nTasks = tasks
            .split('; ')
            .map((task) => {
              return task ? this.i18n.service.translate(task, lang) : task;
            })
            .join('; ');

          if (!series[0]) {
            return null;
          }

          return {
            name: i18nTasks
              ? `${i18nTasks} – ${i18nTestType}`
              : `${i18nTestType} ${i + 1}`,
            series,
          };
        })
        .filter((taskValues) => !!taskValues) as BubbleChartMultiSeries;
    })
  );

  feedbackComments$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackComments = data?.feedbackComments?.map((d) => ({
        ...d,
        date: d.date,
        tag: d.tag ? this.i18n.service.translate(d.tag, lang) : d.tag,
        whats_wrong: d.whats_wrong
          ? this.i18n.service.translate(d.whats_wrong, lang)
          : d.whats_wrong,
      }));
      return [...(feedbackComments || [])];
    })
  );

  feedbackByTagsBarChart$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) => {
      const feedbackByTags = data.dateRangeData?.feedbackByTags || [];
      const feedbackByTagsPrevious =
        data.comparisonDateRangeData?.feedbackByTags || [];

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

  dateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(map(([data, lang]) => getWeeklyDatesLabel(data.dateRange, lang)));

  comparisonDateRangeLabel$ = combineLatest([
    this.projectsDetailsData$,
    this.currentLang$,
  ]).pipe(
    map(([data, lang]) =>
      getWeeklyDatesLabel(data.comparisonDateRange || '', lang)
    )
  );

  feedbackByTagsTable$ = combineLatest([
    this.projectsDetailsData$,
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

  lineTaskChart$ = combineLatest([
        this.projectsDetailsData$,
        this.currentLang$,
      ]).pipe(
        map(([data, lang]) => {
  const taskSuccessByUxData = data?.taskSuccessByUxTest;

      const tasks = taskSuccessByUxData
        ?.map((uxTest) => uxTest?.tasks?.split('; '))
        .reduce((acc, val) => acc.concat(val), [])
        .filter((v, i, a) => a.indexOf(v) === i);

      const taskSuccess = tasks
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
                }
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
          return (a.series).length < (b.series).length ? 1 : -1;
        }) as MultiSeries;

      return taskSuccess;
        })
      );

  constructor(private readonly store: Store, private i18n: I18nFacade) {}

  /**
   * Use the initialization action to perform one
   * or more tasks in your Effects.
   */
  init() {
    this.store.dispatch(ProjectsDetailsActions.loadProjectsDetailsInit());
  }
}

type DateRangeDataIndexKey = keyof ProjectDetailsAggregatedData &
  keyof PickByType<ProjectDetailsAggregatedData, number>;

// helper function to get the percent change of a property vs. the comparison date range
function mapToPercentChange(
  propName: keyof PickByType<ProjectDetailsAggregatedData, number>
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
  sortPath?: string
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
          (previous as any)[i][propPath]
        ),
      }));
    }

    throw Error('Invalid data arrays in mapObjectArraysWithPercentChange');
  });
}
function mapPageMetricsArraysWithPercentChange(
  propName: keyof ProjectDetailsAggregatedData,
  propPath: string
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
