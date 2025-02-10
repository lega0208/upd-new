import { DbService, Page } from '@dua-upd/db';
import { Injectable } from '@nestjs/common';
import { Model, Types, isValidObjectId } from 'mongoose';
import type { DbQuery, IFeedback } from '@dua-upd/types-common';
import dayjs from 'dayjs';
import { omit } from 'rambdax';
import { arrayToDictionary } from '@dua-upd/utils-common';

@Injectable()
export class QueryService {
  constructor(private db: DbService) {}

  async getData(serializedQueries: { [key: string]: string }) {
    const results: { [key: string]: unknown } = {};

    const queryDateRange = {
      start: dayjs().subtract(1, 'week').startOf('week').toDate(),
      end: dayjs().subtract(1, 'week').endOf('week').toDate(),
    };

    for (const key in serializedQueries) {
      const query: DbQuery[keyof DbQuery] = JSON.parse(
        atob(serializedQueries[key]),
      );

      const { collection, filter, project, sort } = query;

      if (isValidObjectId(filter['_id'])) {
        filter['_id'] = new Types.ObjectId(filter['_id']);
      }

      const collectionModel = this.db.collections[collection] as Model<unknown>;

      // large queries on this collection can cripple the db, so we'll limit the results like this for now
      const limit = collection === 'pageMetrics' ? 1000 : undefined;

      if (collection === 'pages') {
        results[key] = await this.db.views.pageVisits.getVisitsWithPageData(
          queryDateRange,
          collectionModel as Model<Page>,
        );
        continue;
      }

      if (collection === 'feedback') {
        const toFilter = (propName: string) => {
          const propFilter = filter[propName];

          if (!propFilter) {
            return;
          }

          if (Array.isArray(propFilter)) {
            const filterArray = propFilter.map((id) => new Types.ObjectId(id));

            return { [propName]: { $in: filterArray } };
          }

          return { [propName]: new Types.ObjectId(propFilter) };
        };

        const pageFilters = toFilter('page');
        const tasksFilters = toFilter('tasks');
        const projectsFilters = toFilter('projects');

        const pageTaskProjectFilters = [
          pageFilters,
          tasksFilters,
          projectsFilters,
        ].filter((f) => f) as { [key: string]: unknown }[];

        const restFilter = omit(['page', 'tasks', 'projects'], filter);

        const queryFilter = {
          ...restFilter,
          ...(pageTaskProjectFilters.length
            ? { $or: pageTaskProjectFilters }
            : {}),
        };

        const pages = await this.db.collections.pages
          .find({}, { title: 1 })
          .lean()
          .exec();
        const tasks = await this.db.collections.tasks
          .find({}, { title: 1, pages: 1 })
          .lean()
          .exec();
        const projects = await this.db.collections.projects
          .find({}, { title: 1, pages: 1 })
          .lean()
          .exec();

        const pagesDict = arrayToDictionary(pages, '_id');
        const tasksDict = arrayToDictionary(tasks, '_id');
        const projectsDict = arrayToDictionary(projects, '_id');

        const feedback = (await collectionModel
          .find(queryFilter, project, { limit })
          .sort(sort)
          .lean()
          .exec()) as IFeedback[];

        const selectedPages = filter['page']?.map(
          (pageId: string | number) => pagesDict[pageId] || '',
        );

        const selectedTasks = filter['tasks']?.map(
          (taskId: string | number) => tasksDict[taskId] || '',
        );

        const selectedProjects = filter['projects']?.map(
          (projectId: string | number) => projectsDict[projectId] || '',
        );

        const feedbackWithTitles = feedback.map((comment) => {
          const page = comment.page || '';
          const tasks = comment.tasks || [];
          const projects = comment.projects || [];

          const pageTitle = pagesDict[page.toString()] || '';
          const taskTitles = tasks.map(
            (_id) => tasksDict[_id.toString()]?.title,
          );

          const projectTitles = projects.map(
            (_id) => projectsDict[_id.toString()]?.title,
          );
          return {
            ...comment,
            pageTitle,
            taskTitles,
            projectTitles,
            selectedPages,
            selectedTasks,
            selectedProjects,
          };
        });

        results[key] = feedbackWithTitles;

        continue;
      }

      results[key] = await collectionModel
        .find(filter, project, { limit })
        .sort(sort)
        .lean()
        .exec();
    }

    return results;
  }
}
