import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { FieldSet, Query, RecordData, Table } from 'airtable';
import { QueryParams, SortParameter } from 'airtable/lib/query_params';

import { squishTrim, wait } from '@dua-upd/utils-common';
import { getATClient, AirTableAPI } from './client';
import { bases } from './base';
import {
  CalldriverData,
  PageData,
  TaskData,
  UxTestData,
  FeedbackData,
  PageListData,
} from './types';
import {
  CreatedFieldRecord,
  FieldRecord,
  FieldRecordQuery,
  Lang,
} from './query';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore);

export * from './client';
export * from './types';

export type DateType = string | Date | Dayjs;

export const createLastUpdatedFilterFormula = (date: DateType) =>
  `IS_AFTER(LAST_MODIFIED_TIME(), "${dayjs.utc(date).format('YYYY-MM-DD')}")`;

export const createDateRangeFilterFormula = (
  dateRange: { start: DateType; end: DateType },
  dateField: string
) => {
  const start = dayjs(dateRange.start)
    .utc(true)
    .subtract(1, 'day')
    .format('YYYY-MM-DD');

  const end = dayjs(dateRange.end).utc(true).add(1, 'day').format('YYYY-MM-DD');

  return `AND(\
      IS_AFTER({${dateField}}, "${start}"),\
      IS_BEFORE({${dateField}}, "${end}")\
    )`.replace(/\s+/g, ' ');
};

export class AirtableClient {
  client: AirTableAPI = getATClient();
  feedbackClient: AirTableAPI = getATClient(
    process.env.AIRTABLE_FEEDBACK_API_KEY
  );

  createQuery(
    baseId: string,
    tableName: string,
    params: QueryParams<FieldSet> = {}
  ): Query<FieldSet> {
    return this.client.base(baseId)(tableName).select(params);
  }

  createFeedbackQuery(
    baseId: string,
    tableName: string,
    params: QueryParams<FieldSet> = {}
  ): Query<FieldSet> {
    return this.feedbackClient.base(baseId)(tableName).select(params);
  }

  async createInsert(
    baseId: string,
    tableName: string,
    fields: Partial<FieldSet>
  ) {
    await this.client
      .base(baseId)(tableName)
      .create(fields, { typecast: true })
      .catch((err) => {
        console.error(err);
      });
    return Promise.resolve();
  }

  async createUpdate(
    baseId: string,
    tableName: string,
    fields: RecordData<Partial<FieldSet>>[]
  ) {
    await this.client
      .base(baseId)(tableName)
      .update(fields)
      .catch((err) => {
        console.error(err);
      });
    return Promise.resolve();
  }

  async createDestroy(baseId: string, tableName: string, id: string[]) {
    await this.client.base(baseId)(tableName).destroy(id);
    return Promise.resolve();
  }

  async deleteRecords(baseId: string, tableName: string, id: string[]) {
    const chunkSize = 10;
    const chunks = [];

    for (let i = 0; i < id.length; i += chunkSize) {
      chunks.push(id.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await this.createDestroy(baseId, tableName, chunk);
    }
  }

  async deleteSearchAssessment(id: string[], lang: Lang = 'en') {
    return await this.deleteRecords(
      bases.SEARCH_ASSESSMENT,
      `CRA - ${lang.toUpperCase()}`,
      id
    );
  }

  async insertRecords(
    baseId: string,
    tableName: string,
    records: RecordData<Partial<FieldSet>>[]
  ) {
    const chunkSize = 10;
    const chunks = [];

    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await this.createInsert(baseId, tableName, chunk);
    }
  }

  async updateRecords(
    baseId: string,
    tableName: string,
    records: RecordData<Partial<FieldSet>>[]
  ) {
    const chunkSize = 10;
    const chunks = [];

    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await this.createUpdate(baseId, tableName, chunk);
    }
  }

  async selectAll(query: Query<FieldSet>): Promise<FieldSet[]> {
    const results: FieldSet[] = [];

    await query.eachPage((records, nextPage) => {
      results.push(...records.map((r) => r._rawJson));

      nextPage();
    });

    return results;
  }

  async getSearchAssessment(
    table = 'CRA - ',
    lastUpdatedDate?: DateType
  ): Promise<FieldRecordQuery[]> {
    const params = lastUpdatedDate
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate),
        }
      : {};
    const query = this.createQuery(bases.SEARCH_ASSESSMENT, `${table}`, params);

    return (await this.selectAll(query)).map(({ id, fields }) => ({
      airtable_id: id,
      query: fields['Query'],
      expected_result: fields['Expected Result'],
      expected_position: fields['Expected Position'],
      pass: fields['Pass'],
      date: fields['Date'],
      total_searches: fields['Total searches'],
      total_clicks: fields['Total clicks'],
      target_clicks: fields['Target clicks'],
      url: fields['URL'],
    })) as FieldRecordQuery[];
  }

  async insertSearchAssessment(
    data,
    lang: Lang = 'en',
    lastUpdatedDate?: DateType
  ) {
    const params = lastUpdatedDate
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate),
        }
      : {};

    return await this.insertRecords(
      bases.SEARCH_ASSESSMENT,
      `CRA - ${lang.toUpperCase()}`,
      data
    );
  }

  async insertExpectedDB(data, table = 'Expected - EN') {
    return await this.insertRecords(bases.SEARCH_ASSESSMENT, `${table}`, data);
  }

  async updateSearchAssessment(
    data: RecordData<Partial<FieldSet>>[],
    lang: Lang = 'en'
  ) {
    console.log(lang);
    return await this.updateRecords(
      bases.SEARCH_ASSESSMENT,
      `CRA - ${lang.toUpperCase()}`,
      data
    );
  }

  async getTasks(lastUpdatedDate?: DateType): Promise<TaskData[]> {
    const params = lastUpdatedDate
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate),
        }
      : {};
    const query = this.createQuery(bases.TASKS_INVENTORY, 'Tasks', params);

    return (await this.selectAll(query)).map(({ id, fields }) => ({
      airtable_id: id,
      title: squishTrim(fields['Task']),
      group: squishTrim(fields['Group']),
      subgroup: squishTrim(fields['Sub-Group']),
      topic: squishTrim(fields['Topic']),
      subtopic: squishTrim(fields['Sub Topic']),
      ux_tests: fields['User Testing Projects'],
      user_type: fields['User Type'],
      pages: fields['Pages'],
    })) as TaskData[];
  }

  async getUxTests(lastUpdatedDate?: DateType): Promise<UxTestData[]> {
    const params = lastUpdatedDate
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate),
        }
      : {};
    const query = this.createQuery(
      bases.TASKS_INVENTORY,
      'User Testing',
      params
    );

    return (await this.selectAll(query)).map(({ id, fields }) => ({
      airtable_id: id,
      date: fields['Date']
        ? dayjs.utc(fields['Date']).toDate()
        : fields['Date'],
      title: squishTrim(fields['UX Research Project Title']),
      success_rate: fields['Success Rate'],
      test_type: squishTrim(fields['Test Type']),
      session_type: Array.isArray(fields['Session Type'])
        ? squishTrim(fields['Session Type'][0])
        : undefined,
      scenario: fields['Scenario/Questions'],
      tasks: fields['Task'],
      subtasks: fields['Sub-Task'],
      pages: fields['Pages_RecordIds'],
      vendor: fields['Vendor'],
      version_tested: fields['Version Tested'],
      github_repo: fields['GitHub Repo'],
      total_users: fields['# of Users'],
      successful_users: fields['Succesful Users'],
      program: fields['Program/Service'],
      branch: fields['Branch'],
      audience: fields['Audience'],
      project_lead: fields['Project Lead'],
      launch_date: fields['Launch Date'],
      status: squishTrim(fields['Status']),
      cops: fields['COPS'],
      attachments: fields['Attachments (Ex. Scorecard)'],
    })) as UxTestData[];
  }

  async getPages(lastUpdatedDate?: DateType): Promise<PageData[]> {
    const params = lastUpdatedDate
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate),
        }
      : {};
    const query = this.createQuery(bases.TASKS_INVENTORY, 'Pages', params);

    return (await this.selectAll(query))
      .filter(({ fields }) => !!fields['Url'])
      .map(({ id, fields }) => ({
        airtable_id: id,
        title: fields['Page Title'],
        url: fields['Url'],
        tasks: fields['Tasks'],
      })) as PageData[];
  }

  createCalldriverQueries(dateRange: { start: DateType; end: DateType }) {
    const queries: Query<FieldSet>[] = [];

    const start = dayjs(dateRange.start).utc(true);
    const end = dayjs(dateRange.end).utc(true);

    let queryDate = dayjs(dateRange.start).utc(true);

    if (start.isBefore('2021-01-01', 'day')) {
      throw Error('Calldriver data is not available before 2021-01-01');
    }

    while (queryDate.isSameOrBefore(end)) {
      const baseId = bases[`DCD_${queryDate.year()}_Q${queryDate.quarter()}`];
      const table = `${queryDate.format('MMMM')} ${queryDate.year()}`;
      const filterByFormula = createDateRangeFilterFormula(
        dateRange,
        'CALL_DATE'
      );
      const sort = [
        { field: 'CALL_DATE', direction: 'asc' } as SortParameter<FieldSet>,
      ];

      queries.push(this.createQuery(baseId, table, { filterByFormula, sort }));

      queryDate = queryDate.add(1, 'month').startOf('month');
    }

    return queries;
  }

  async getCalldrivers(dateRange: { start: DateType; end: DateType }) {
    const queries = this.createCalldriverQueries(dateRange);

    const results = [];

    for (const query of queries) {
      const records = await this.selectAll(query);

      results.push(...records);
    }

    return results.map(({ id, fields }) => ({
      airtable_id: id,
      date: dayjs(fields['CALL_DATE']).utc(true).toDate(),
      enquiry_line: fields['Enquiry_line'],
      topic: fields['Topic'],
      subtopic: fields['Sub-topic'],
      sub_subtopic: fields['Sub-sub-topic'],
      tpc_id: fields['TPC_ID'],
      impact: fields['Impact'],
      calls: fields['Calls'],
    })) as CalldriverData[];
  }

  async getFeedback(
    dateRange: { start: DateType; end: DateType } = {} as typeof dateRange
  ) {
    const filterByFormula = createDateRangeFilterFormula(dateRange, 'Date');
    const query = this.createQuery(bases.FEEDBACK, 'Page feedback', {
      filterByFormula,
    });

    return (await this.selectAll(query))
      .filter(({ fields }) => fields['URL'] && fields['Date'])
      .map(({ id, fields }) => ({
        airtable_id: id,
        url: fields['URL'].replace(/^https:\/\//i, ''),
        date: dayjs.utc(fields['Date']).toDate(),
        lang: fields['Lang'],
        comment: fields['Comment'],
        tags: fields['Lookup_tags'],
        status: fields['Status'],
        whats_wrong: fields["What's wrong"],
        main_section: fields['Main section'],
        theme: fields['Theme'],
      })) as FeedbackData[];
  }

  async getTasksTopicsMap() {
    const filterByFormula = 'NOT({Task} = "")';

    const query = this.createQuery(
      bases.TASKS_INVENTORY,
      'Unique Call Drivers',
      {
        filterByFormula,
      }
    );

    const results = (await this.selectAll(query)).map(
      ({ fields }) =>
        ({
          tpc_id: fields['TPC ID'],
          tasks: fields['Task'],
        } as { tpc_id: number; tasks: string[] })
    );

    const tasksTopicsMap = results.reduce((tasksTopicsMap, topicTasks) => {
      for (const task of topicTasks.tasks) {
        if (!tasksTopicsMap[task]) {
          tasksTopicsMap[task] = new Set();
        }
        tasksTopicsMap[task].add(topicTasks.tpc_id);
      }

      return tasksTopicsMap;
    }, {} as Record<string, Set<number>>);

    return Object.keys(tasksTopicsMap).reduce((newMap, task) => {
      newMap[task] = Array.from(tasksTopicsMap[task]);
      return newMap;
    }, {} as Record<string, number[]>);
  }

  async getPagesList(lastUpdated?: Date): Promise<PageListData[]> {
    const params = lastUpdated
      ? {
          filterByFormula: createLastUpdatedFilterFormula(lastUpdated),
        }
      : {};

    const query = this.createQuery(bases.PAGES, 'Published CRA pages', params);

    return (await this.selectAll(query)).map<PageListData>(({ id, fields }) => {
      const url = squishTrim(fields['Page path'] as string).replace(
        'https://',
        ''
      );

      return {
        url,
        airtable_id: id,
        title: squishTrim(fields['Page title'] as string),
        lang: squishTrim(fields['Language (jcr:language)']),
        last_255: url.slice(-255),
      };
    });
  }
}
