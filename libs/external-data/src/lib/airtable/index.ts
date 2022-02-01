import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { getATClient, AirTableAPI, AirtableAPIBase } from './client';
import { bases } from './base';
import { AirTableFields } from './query'

dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore)

export * from './client';

export class AirtableClient {
  client: AirTableAPI;

  async initClient() {
    this.client = await getATClient();
  }

  async getTasks(): Promise<string[]> {
    if (!this.client) {
      await this.initClient();
    }

    const base: AirtableAPIBase = this.client.base(bases.TASKS_INVENTORY);
    const allResults: string[] = [];

    const results: void = await base('Tasks')
      .select()
      .eachPage((records, fetchNextPage) => {
        records.forEach((record) => {
          allResults.push(record._rawJson);
        });
        fetchNextPage();
      });

    return allResults;
  }

  async findTask( id: string ): Promise<string[]> {
    if (!this.client) {
      await this.initClient();
    }

    const base: AirtableAPIBase = this.client.base(bases.TASKS_INVENTORY);
    const allResults: string[] = [];

    const results = await base('Tasks').find(id);

    allResults.push(results._rawJson);

    return allResults;
  }

  async getCallDriverCall(
    element: Record<AirTableFields, string>,
    dateRange: {
      start: Dayjs;
      end: Dayjs;
    }
  ): Promise<string[]> {
    //console.log(element.base);
    const allResults: string[] = [];

    const base: AirtableAPIBase = this.client.base(bases[`${element.base}`]);
    const results: void = await base(`${element.table}`)
      .select({
        filterByFormula: `AND(IS_AFTER({CALL_DATE}, DATEADD("${dateRange.start}",-1,"days")), IS_BEFORE({CALL_DATE}, DATEADD("${dateRange.end}",1,"days")))`,
        sort: [{ field: 'CALL_DATE', direction: 'asc' }],
      })
      .eachPage((records, fetchNextPage) => {
        records.forEach((record) => {
          allResults.push(record._rawJson);
        });
        fetchNextPage();
      });

    //console.log(allResults);

    return allResults;
  }

  async getCallDriver(dateRange: { start: string; end: string }) {
    if (!this.client) {
      await this.initClient();
    }

    const start: Dayjs = dayjs(dateRange.start).utc(true);
    const end: Dayjs = dayjs(dateRange.end).utc(true);
    let tempDate: Dayjs = dayjs(dateRange.start).utc(true);
    const datesBetween: Array<Record<AirTableFields, string>> = [];

    const year: number = start.get('year');
    if (year > 2020) {
      while (tempDate.isSameOrBefore(end)) {
        datesBetween.push({
          table: tempDate.format('MMMM') + ' ' + tempDate.year(),
          base: 'DCD_' + tempDate.year() + '_Q' + tempDate.quarter(),
        });

        tempDate = tempDate.set('date', 1).add(1, 'month');
      }

      const allResults: Array<string[]> = await Promise.all(
        datesBetween.map(async (dates: Record<AirTableFields, string>) => {
          return await this.getCallDriverCall(dates, { start, end });
        })
      );

      return allResults
        .reduce((r, a) => r.concat(a), [])
        .reduce((parsedResults, row) => {
          const newData = {
            _id: row['id'],
            date: row['fields']['CALL_DATE'],
            enquiry_line: row['fields']['Enquiry_line'],
            topic: row['fields']['Topic'],
            sub_topic: row['fields']['Sub-topic'],
            tpc_id: row['fields']['TPC_ID'],
            impact: row['fields']['Impact'],
            calls: row['fields']['Calls'],
          };
          return [...parsedResults, newData];
        }, []);
    } else return;
  }
}
