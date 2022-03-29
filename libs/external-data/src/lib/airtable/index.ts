import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FieldSet, Query } from 'airtable';
import { QueryParams, SortParameter } from 'airtable/lib/query_params';
import { wait } from '@cra-arc/utils-common';
import { getATClient, AirTableAPI } from './client';
import { bases } from './base';
import { CalldriverData, PageData, TaskData, UxTestData } from './types';

dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore)

export * from './client';
export * from './types';

export type DateType = string | Date | Dayjs;

export const createLastUpdatedFilterFormula = (date: DateType) => (
  `IS_AFTER(LAST_UPDATED_TIME(), "${dayjs(date).format('YYYY-MM-DD')}")`
);

export const createDateRangeFilterFormula = (dateRange: { start: DateType, end: DateType }, dateField: string) => {
  const start = dayjs(dateRange.start)
    .utc(true)
    .subtract(1, 'day')
    .format('YYYY-MM-DD');

  const end = dayjs(dateRange.end)
    .utc(true)
    .add(1, 'day')
    .format('YYYY-MM-DD');

  return (
    `AND(\
      IS_AFTER({${dateField}}, "${start}"),\
      IS_BEFORE({${dateField}}, "${end}")\
    )`.replace(/\s+/g, '')
  );
};

export class AirtableClient {
  client: AirTableAPI = getATClient();

  createQuery(baseId: string, tableName: string, params: QueryParams<FieldSet> = {}): Query<FieldSet> {
    return this.client.base(baseId)(tableName).select(params);
  }

  async selectAll(query: Query<FieldSet>): Promise<FieldSet[]> {
    const results = [];

    await query.eachPage((records, nextPage) => {
      results.push(...(records.map((r) => r._rawJson)));

      wait(201).then(nextPage);
    });

    return results;
  }

  async getTasks(lastUpdatedDate?: DateType): Promise<TaskData[]> {
    const params = lastUpdatedDate ? {
      filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate)
    } : {};
    const query = this.createQuery(bases.TASKS_INVENTORY, 'Tasks', params);

    return (await this.selectAll(query))
      .map(({ id, fields }) => ({
        airtable_id: id,
        title: fields['Task'],
        group: fields['Group'],
        subgroup: fields['Sub-Group'],
        topic: fields['Topic'],
        subtopic: fields['Sub Topic'],
        ux_tests: fields['User Testing Projects'],
        user_type: fields['User Type'],
        pages: fields['Pages 2'],
      })) as TaskData[];
  }

  async getUxTests(lastUpdatedDate?: DateType): Promise<UxTestData[]> {
    const params = lastUpdatedDate ? {
      filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate)
    } : {};
    const query = this.createQuery(bases.TASKS_INVENTORY, 'User Testing', params);

    return (await this.selectAll(query))
      .map(({ id, fields }) => ({
        airtable_id: id,
        date: dayjs(fields['Date']).utc(true).toDate(),
        project_title: fields['UX Research Project Title'],
        success_rate: fields['Success Rate'],
        test_type: fields['Test Type'],
        session_type: Array.isArray(fields['Session Type'])
          ? fields['Session Type'][0]
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
        status: fields['Status'],
        cops: fields['COPS'],
      })) as UxTestData[];
  }

  async getPages(lastUpdatedDate?: DateType): Promise<PageData[]> {
    const params = lastUpdatedDate ? {
      filterByFormula: createLastUpdatedFilterFormula(lastUpdatedDate)
    } : {};
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

  createCalldriverQueries(dateRange: { start: DateType, end: DateType }) {
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
      const filterByFormula = createDateRangeFilterFormula(dateRange, 'CALL_DATE');
      const sort = [{ field: 'CALL_DATE', direction: 'asc' } as SortParameter<FieldSet>];

      queries.push(this.createQuery(baseId, table, { filterByFormula, sort }));

      queryDate = queryDate.add(1, 'month').startOf('month');
    }

    return queries;
  }

  async getCalldrivers(dateRange: { start: DateType, end: DateType}) {
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
}
