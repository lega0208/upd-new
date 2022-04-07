import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cache } from 'cache-manager';
import { PageMetrics, Project, Task, UxTest } from '@cra-arc/db';
import type {
  PageMetricsModel,
  ProjectDocument,
  TaskDocument,
  TaskDetailsData,
  TasksHomeData,
  TaskDetailsAggregatedData,
  UxTestDocument,
} from '@cra-arc/types-common';
import type { ApiParams } from '@cra-arc/upd/services';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(UxTest.name) private uxTestModel: Model<UxTestDocument>,
    @InjectModel(PageMetrics.name) private pageMetricsModel: PageMetricsModel,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getTasksHomeData(dateRange: string): Promise<TasksHomeData> {
    const tasksData = (
      await this.taskModel.find({}).sort({ title: 1 }).lean()
    ).map((task) => ({ ...task, visits: 12 }));

    return {
      dateRange,
      dateRangeData: tasksData,
    };
  }

  async getTaskDetails(params: ApiParams): Promise<TaskDetailsData> {
    if (!params.id) {
      throw Error(
        'Attempted to get Task details from API but no id was provided.'
      );
    }

    const task = await this.taskModel
      .findById(new Types.ObjectId(params.id), {
        airtable_id: 0,
        user_type: 0,
      })
      .populate('pages')
      .populate('ux_tests');

    const taskUrls = task.pages
      .map((page) => ('url' in page && page.url) || '')
      .filter((url) => !!url);

    const returnData: TaskDetailsData = {
      _id: task._id.toString(),
      title: task.title,
      dateRange: params.dateRange,
      dateRangeData: await getTaskAggregatedData(
        this.pageMetricsModel,
        params.dateRange,
        taskUrls
      ),
      comparisonDateRange: params.comparisonDateRange,
      comparisonDateRangeData: await getTaskAggregatedData(
        this.pageMetricsModel,
        params.comparisonDateRange,
        taskUrls
      ),
      taskSuccessByUxTest: [],
      avgTaskSuccessFromLastTest: 1, // todo: better handle N/A
    };

    if (task.ux_tests && task.ux_tests.length !== 0) {
      returnData.taskSuccessByUxTest = task.ux_tests
        .map(
          (uxTest) =>
            typeof uxTest === 'object' && {
              title: uxTest.title,
              date: uxTest.date,
              testType: uxTest.test_type,
              successRate: uxTest.success_rate,
            }
        )
        .filter((uxTest) => !!uxTest);

      // todo: aggregate projects instead of single test
      const lastUxTest = task.ux_tests.sort(
        (current, next) => next.date.getTime() - current.date.getTime()
      )[0];

      returnData.avgTaskSuccessFromLastTest =
        'success_rate' in lastUxTest ? lastUxTest.success_rate : 1; // todo: better handle nulls
    }

    return returnData;
  }
}

async function getTaskAggregatedData(
  pageMetricsModel: PageMetricsModel,
  dateRange: string,
  pageUrls: string[]
): Promise<Omit<TaskDetailsAggregatedData, 'avgTaskSuccess'>> {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  const results = await pageMetricsModel
    .aggregate<TaskDetailsAggregatedData>()
    .sort({ date: -1, url: 1 })
    .match({
      date: { $gte: startDate, $lte: endDate },
      url: { $in: pageUrls },
    })
    .group({
      _id: '$url',
      visits: { $sum: '$visits' },
      dyfYes: { $sum: '$dyf_yes' },
      dyfNo: { $sum: '$dyf_no' },
    })
    .group({
      _id: null,
      visits: { $sum: '$visits' },
      dyfYes: { $sum: '$dyfYes' },
      dyfNo: { $sum: '$dyfNo' },
      visitsByPage: { $addToSet: '$$ROOT' },
    })
    .lookup({
      from: 'pages',
      localField: 'visitsByPage._id',
      foreignField: 'url', // not all_urls...
      as: 'pages',
    })
    .addFields({
      visitsByPage: {
        $map: {
          input: {
            $zip: {
              inputs: [
                '$visitsByPage',
                {
                  $map: {
                    input: '$pages',
                    as: 'page',
                    in: { _id: '$$page._id', title: '$$page.title' },
                  },
                },
              ],
              useLongestLength: true,
            },
          },
          as: 'pageObjects',
          in: {
            $mergeObjects: '$$pageObjects',
          },
        },
      },
    })
    .project({ _id: 0, pages: 0 })
    .exec();

  return results[0];
}
