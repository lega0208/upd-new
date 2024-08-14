import {
  AggregateOptions,
  mongo,
  ProjectionType,
  QueryOptions,
  Types,
  type FilterQuery,
} from 'mongoose';
import { omit, pick } from 'rambdax';
import type { TasksView, TasksViewSchema } from './tasks-view.schema';
import type {
  DateRange,
  GscSearchTermMetrics,
  InternalSearchTerm,
  IProject,
  ITask,
  ITaskView,
  IUxTest,
} from '@dua-upd/types-common';
import {
  arrayToDictionary,
  arrayToDictionaryMultiref,
  getSelectedPercentChange,
  sum,
} from '@dua-upd/utils-common';
import { DbService } from '../db.service';
import { DbViewNew, type ViewConfig } from '../db.views.new';
import { topLevelMetricsGrouping } from './metrics';

export type TasksViewConfig = ViewConfig<typeof TasksViewSchema>;

/**
 * The base document data that will be passed to the refresh method
 * to generate a single write operation for a view document.
 */
type BaseDoc = Omit<ITask, 'projects' | 'ux_tests'> & {
  projects: IProject[];
  ux_tests: IUxTest[];
  gc_survey_participants: number;
  gc_survey_completed: number;
};

/**
 * The context object that will be passed to the refresh method
 * to be shared between all refresh operations.
 */
type RefreshContext = {
  dateRange: {
    start: Date;
    end: Date;
  };
};

type RefreshWriteOp = {
  updateOne: mongo.UpdateOneModel<ITaskView> & { upsert: true };
};

export class TasksViewService extends DbViewNew<
  typeof TasksViewSchema,
  BaseDoc,
  RefreshContext
> {
  protected readonly refreshFilterProps: (keyof TasksView)[] = [
    'dateRange',
    'pages',
    'task',
    'projects',
  ];

  constructor(
    private db: DbService,
    config: TasksViewConfig,
  ) {
    super(config);
  }

  async prepareRefreshContext(
    filter: FilterQuery<TasksView> & DateRange<Date>,
  ) {
    const tasksCollectionIdFilter = filter.task ? { _id: filter.task } : {};

    const otherCollectionsIdFilter = filter.task ? { tasks: filter.task } : {};

    const [projectsDict, uxTestsDict, gcTasksDict] = await Promise.all([
      this.db.collections.projects
        .find(otherCollectionsIdFilter)
        .lean()
        .exec()
        .then((projects) =>
          arrayToDictionaryMultiref(projects || [], 'tasks', true),
        ),
      this.db.collections.uxTests
        .find(otherCollectionsIdFilter)
        .lean()
        .exec()
        .then((uxTests) =>
          arrayToDictionaryMultiref(uxTests || [], 'tasks', true),
        ),
      this.db.collections.gcTasks
        .getTotalEntries(filter.dateRange)
        .then((gcTasks) => arrayToDictionary(gcTasks || [], 'gc_task')),
    ]);

    const tasks = await this.db.collections.tasks
      .find(tasksCollectionIdFilter)
      .lean()
      .exec()
      .then(
        (tasks) =>
          tasks?.map((task) => {
            const gcTaskParticipants =
              task.gc_tasks
                ?.map((gcTask) => gcTasksDict[gcTask.title])
                .filter(Boolean) || [];

            return {
              ...task,
              projects: projectsDict[task._id.toString()] || [],
              ux_tests: uxTestsDict[task._id.toString()] || [],
              gc_survey_participants: sum(
                gcTaskParticipants.map(({ total_entries }) => total_entries),
              ),
              gc_survey_completed: sum(
                gcTaskParticipants.map(
                  ({ completed_entries }) => completed_entries,
                ),
              ),
            };
          }) || [],
      );
    return {
      baseDocs: tasks,
      ctx: {
        dateRange: filter.dateRange as DateRange<Date>,
      },
    };
  }

  async refresh(task: BaseDoc, { dateRange }: RefreshContext) {
    console.log('task: ' + task._id);
    const dateFilter = {
      date: { $gte: dateRange.start, $lte: dateRange.end },
    };
    const taskFilter = { ...dateFilter, tasks: task._id };

    const [
      topLevelMetrics,
      aaSearchterms,
      gscSearchterms,
      metricsByDay,
      calldriversEnquiry,
      callsByTopic,
      mostRelevantCommentsAndWords,
      pages,
    ] = await Promise.all([
      this.getTopLevelTaskMetrics({
        tasks: task._id,
        dateRange,
      }),
      this.getTaskAASearchterms({
        tasks: task._id,
        dateRange,
      }),
      this.getTaskGSCSearchterms({
        tasks: task._id,
        dateRange,
      }),
      this.getMetricsByDay(taskFilter),
      this.db.collections.callDrivers.getCallsByEnquiryLine(dateRange, {
        tasks: task._id,
      }),
      this.db.collections.callDrivers.getCallsByTopic(dateRange, {
        tasks: task._id,
      }),
      this.db.collections.feedback.getMostRelevantCommentsAndWords({
        dateRange,
        type: 'task',
        id: task._id.toString(),
      }),
      this.db.views.pages
        .find(
          {
            tasks: task._id,
            dateRange: dateRange,
          },
          {
            tasks: 0,
            projects: 0,
          },
        )
        .then(
          (pages) =>
            pages?.map((page) =>
              pick(
                [
                  '_id',
                  'page',
                  'pageStatus',
                  'visits',
                  'dyf_yes',
                  'dyf_no',
                  'numComments',
                  'gsc_total_clicks',
                  'gsc_total_impressions',
                  'gsc_total_ctr',
                  'gsc_total_position',
                ],
                page,
              ),
            ) || [],
        ),
    ]);

    const tmf_ranking_index =
      (topLevelMetrics.visits || 0) * 0.1 +
      (topLevelMetrics.totalCalls || 0) * 0.6 +
      (task.gc_survey_participants || 0) * 0.3;

    const taskViewDoc = {
      task: omit(
        [
          'pages',
          'projects',
          'uxTests',
          'gc_survey_participants',
          'gc_survey_completed',
        ],
        task,
      ),
      ...topLevelMetrics,
      aa_searchterms: aaSearchterms,
      gsc_searchterms: gscSearchterms,
      metricsByDay,
      calldriversEnquiry,
      callsByTopic,
      tmf_ranking_index,
      cops: !!task.ux_tests?.find((test) => test.cops),
      gc_survey_participants: task.gc_survey_participants,
      gc_survey_completed: task.gc_survey_completed,
      mostRelevantCommentsAndWords,
      numComments:
        mostRelevantCommentsAndWords.en.comments.length +
        mostRelevantCommentsAndWords.fr.comments.length,
      pages,
      projects: task.projects.map((project) =>
        omit(['pages', 'tasks', 'ux_tests'], project),
      ),
      ux_tests: task.ux_tests.map((uxTest) => omit(['pages', 'tasks'], uxTest)),
      lastUpdated: new Date(),
    };

    return {
      updateOne: {
        filter: {
          dateRange,
          'task._id': task._id,
        },
        update: {
          $setOnInsert: {
            _id: new Types.ObjectId(),
            dateRange,
          },
          $set: taskViewDoc,
        },
        upsert: true,
      },
    } satisfies RefreshWriteOp;
  }

  private async getTopLevelTaskMetrics(filter: {
    tasks: Types.ObjectId;
    dateRange: DateRange<Date>;
  }) {
    const pageMetrics = ((
      await this.db.views.pages
        .aggregate(filter)
        .project({
          aa_searchterms: 0,
          activity_map: 0,
          gsc_searchterms: 0,
        })
        .group({
          _id: null,
          ...topLevelMetricsGrouping,
        })
        .project({
          _id: 0,
        })
        .exec()
    )?.[0] || {}) as Record<keyof typeof topLevelMetricsGrouping, number>;

    const pageMetricsCamelCase = {
      dyfNo: pageMetrics.dyf_no,
      dyfYes: pageMetrics.dyf_yes,
      visits: pageMetrics.visits,
      dyfNoPerVisits: pageMetrics.visits
        ? pageMetrics.dyf_no / pageMetrics.visits
        : null,
      gscTotalClicks: pageMetrics.gsc_total_clicks,
      gscTotalImpressions: pageMetrics.gsc_total_impressions,
      gscTotalCtr: pageMetrics.gsc_total_ctr,
      gscTotalPosition: pageMetrics.gsc_total_position,
    };

    const totalCalls =
      (
        await this.db.collections.callDrivers
          .aggregate<{ calls: number }>()
          .match({
            tasks: filter.tasks,
            date: { $gte: filter.dateRange.start, $lte: filter.dateRange.end },
          })
          .group({
            _id: null,
            calls: {
              $sum: '$calls',
            },
          })
          .project({
            _id: 0,
          })
          .exec()
      )?.[0]?.calls || 0;

    const callsPerVisits = pageMetrics.visits
      ? totalCalls / pageMetrics.visits
      : null;

    return {
      ...pageMetricsCamelCase,
      totalCalls,
      callsPerVisits,
    };
  }

  private async getTaskAASearchterms(filter: {
    tasks: Types.ObjectId;
    dateRange: DateRange<Date>;
  }) {
    return (
      (await this.db.views.pages
        .aggregate<InternalSearchTerm>(filter)
        .project({ dateRange: 1, aa_searchterms: 1, tasks: 1 })
        .unwind('$aa_searchterms')
        .group({
          _id: '$aa_searchterms.term',
          clicks: {
            $sum: '$aa_searchterms.clicks',
          },
          position: {
            $avg: '$aa_searchterms.position',
          },
        })
        .sort({ clicks: -1 })
        .limit(100)
        .project({
          _id: 0,
          term: '$_id',
          clicks: 1,
          position: {
            $round: ['$position', 2],
          },
        })
        .exec()) || []
    );
  }

  private async getTaskGSCSearchterms(filter: {
    tasks: Types.ObjectId;
    dateRange: DateRange<Date>;
  }) {
    return (
      (await this.db.views.pages
        .aggregate<GscSearchTermMetrics>(filter)
        .project({
          dateRange: 1,
          gsc_searchterms: 1,
          tasks: 1,
        })
        .unwind('$gsc_searchterms')
        .group({
          _id: '$gsc_searchterms.term',
          clicks: {
            $sum: '$gsc_searchterms.clicks',
          },
          ctr: {
            $avg: '$gsc_searchterms.ctr',
          },
          impressions: {
            $sum: '$gsc_searchterms.impressions',
          },
          position: {
            $avg: '$gsc_searchterms.position',
          },
        })
        .sort({ clicks: -1 })
        .limit(100)
        .project({
          _id: 0,
          term: '$_id',
          clicks: 1,
          ctr: {
            $round: ['$ctr', 2],
          },
          impressions: 1,
          position: {
            $round: ['$position', 2],
          },
        })
        .exec()) || []
    );
  }

  private async getMetricsByDay(filter: {
    tasks: Types.ObjectId;
    date: { $gte: Date; $lte: Date };
  }) {
    const [feedbackByDay, calldriversByDay, pageMetricsByDay] =
      await Promise.all([
        // feedback by day (array)
        this.db.collections.feedback
          .getCommentsByDay(
            { start: filter.date.$gte, end: filter.date.$lte },
            {
              tasks: filter.tasks,
            },
          )
          .then((feedback) =>
            feedback.map(({ date, sum }) => ({
              date: date.toISOString(),
              numComments: sum,
            })),
          ),
        // calldrivers by day (dictionary)
        this.db.collections.callDrivers
          .aggregate<{ date: Date; calls: number }>()
          .project({
            date: 1,
            calls: 1,
            tpc_id: 1,
          })
          .match(filter)
          .group({
            _id: '$date',
            calls: {
              $sum: '$calls',
            },
          })
          .project({
            _id: 0,
            date: '$_id',
            calls: 1,
          })
          .sort({ date: 1 })
          .exec()
          .then((calldrivers) =>
            arrayToDictionary(
              calldrivers?.map(({ date, calls }) => ({
                date: date.toISOString(),
                calls,
              })) || [],
              'date',
            ),
          ),
        // page metrics by day (dictionary)
        this.db.collections.pageMetrics
          .aggregate<{
            date: Date;
            visits: number;
            dyfNo: number;
            dyfNoPerVisits: number | null;
            dyfYes: number;
          }>()
          .project({
            date: 1,
            visits: 1,
            dyf_no: 1,
            dyf_yes: 1,
            tasks: 1,
          })
          .match(filter)
          .group({
            _id: '$date',
            visits: { $sum: '$visits' },
            dyf_no: { $sum: '$dyf_no' },
            dyf_yes: { $sum: '$dyf_yes' },
          })
          .project({
            _id: 0,
            date: '$_id',
            visits: 1,
            dyfNo: '$dyf_no',
            dyfNoPerVisits: {
              $cond: [
                // todo: this needs to convert all nullish cases?
                { $eq: ['$visits', 0] },
                null,
                { $divide: ['$dyf_no', '$visits'] },
              ],
            },
            dyfYes: '$dyf_yes',
          })
          .exec()
          .then((pageMetrics) =>
            arrayToDictionary(
              pageMetrics?.map(
                ({ date, visits, dyfNo, dyfNoPerVisits, dyfYes }) => ({
                  date: date.toISOString(),
                  visits,
                  dyfNo,
                  dyfNoPerVisits,
                  dyfYes,
                }),
              ) || [],
              'date',
            ),
          ),
      ]);

    // iterate over feedback because it already makes sure to include all days
    return feedbackByDay.map((feedback) => {
      const calldrivers = calldriversByDay[feedback.date] || {
        date: feedback.date,
        calls: 0,
      };
      const pageMetrics = pageMetricsByDay[feedback.date] || {
        date: feedback.date,
        visits: 0,
        dyfNo: 0,
        dyfNoPerVisits: null,
        dyfYes: 0,
      };

      // should these be pre-calculated for "per 100/1000 visits"?
      const callsPerVisit = pageMetrics.visits
        ? calldrivers.calls / pageMetrics.visits
        : null;

      const commentsPerVisits = pageMetrics.visits
        ? feedback.numComments / pageMetrics.visits
        : null;

      return {
        ...feedback,
        ...calldrivers,
        ...pageMetrics,
        callsPerVisit,
        commentsPerVisits,
      };
    });
  }

  // overriding inherited methods for cleaner types
  override find(
    filter?: FilterQuery<TasksView>,
    projection: ProjectionType<TasksView> = {},
    options: QueryOptions<TasksView> = {},
  ): Promise<TasksView[]> {
    return super.find(filter, projection, options);
  }

  override findOne(
    filter?: FilterQuery<TasksView>,
    projection: ProjectionType<TasksView> = {},
    options: QueryOptions<TasksView> = {},
  ): Promise<TasksView> {
    return super.findOne(filter, projection, options);
  }

  override aggregate<T>(
    filter: FilterQuery<TasksView>,
    options?: AggregateOptions,
  ) {
    return super.aggregate<T>(filter, options);
  }

  async getTop50Tasks(dateRange: { start: Date; end: Date }) {
    return await this._model
      .aggregate<{
        task: ITask;
        ux_tests?: Omit<IUxTest, 'pages' | 'tasks' | 'projects'>[];
      }>()
      .match({
        dateRange,
      })
      .sort({
        tmf_ranking_index: -1,
      })
      .limit(50)
      .project({
        task: 1,
        ux_tests: 1,
      })
      .exec()
      .then((tasks) =>
        tasks.map((task) => ({
          ...task.task,
          ux_tests: task.ux_tests,
        })),
      );
  }

  async findOneDateRangeWithComparisons(
    taskId: Types.ObjectId,
    dateRange: DateRange<Date>,
    comparisonDateRange: DateRange<Date>,
  ) {
    const [taskData, comparisonData] = await Promise.all([
      this.findOne({ 'task._id': taskId, dateRange }),
      this.findOne({ 'task._id': taskId, dateRange: comparisonDateRange }),
    ]);

    // @@@@ will need to either modify function with option to add absolute change, or create a new function
    const taskDataWithComparisons = getSelectedPercentChange(
      comparisonProps,
      taskData,
      comparisonData,
    );

    return taskDataWithComparisons;
  }
}

const comparisonProps = [
  'dyfNo',
  'dyfYes',
  'visits',
  'gscTotalClicks',
  'gscTotalImpressions',
  'gscTotalCtr',
  'gscTotalPosition',
  'totalCalls',
  'callsPerVisits',
  'dyfNoPerVisits',
  // more...?
] satisfies (keyof TasksView)[];
