import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

export * from './client';
export * from './query';
export * from './aa-dimensions';
export * from './aa-metrics';
export * from './itemid';

import { Types } from 'mongoose';
import { Overall } from '@cra-arc/db';
import { AnalyticsCoreAPI, getAAClient } from './client';
import { withTimeout } from '../utils';
import {
  AdobeAnalyticsQueryBuilder,
  CALCULATED_METRICS,
  SEGMENTS,
  getArraySeperated,
  sortArrayDesc
} from './query';

dayjs.extend(utc);

export class AdobeAnalyticsClient {
  client: AnalyticsCoreAPI;
  queryBuilder = new AdobeAnalyticsQueryBuilder();

  async initClient() {
    this.client = await getAAClient();
  }

  async getOverallMetrics(dateRange: {
    start: string;
    end: string;
  }): Promise<Overall[]> {
    // todo: better way to handle dates / allow single dates
    if (!this.client) {
      await this.initClient();
    }

    const formattedDate = `${dateRange.start}/${dateRange.end}`;
    console.log(formattedDate);

    // Todo: Create a "registry" of prebuilt queries somewhere?
    //  Also modify query builder to allow for passing an array of metrics & handle columnIds automatically
    const overallMetricsQuery = this.queryBuilder
      .setDimension('variables/daterangeday')
      .addMetric('metrics/visits', '2')
      .addMetric('metrics/visitors', '3')
      .addMetric('metrics/pageviews', '4')
      .addMetric('metrics/averagetimespentonsite', '5') // this is probably the wrong metric
      .addMetric('metrics/event85', '6') // dyf - Submit
      .addMetric('metrics/event83', '7') // dyf - Yes click
      .addMetric('metrics/event84', '8') // dyf - No click
      .addMetric('metrics/bouncerate', '9')
      .addMetric('metrics/event73', '10') // RAP initiated
      .addMetric('metrics/event75', '11') // RAP completed
      .addMetric('metrics/event69', '12') // Nav menu initiated
      .addMetric(CALCULATED_METRICS.RAP_CANT_FIND, '13') // RAP - I can't find what I'm looking for
      .addMetric(CALCULATED_METRICS.RAP_LOGIN_ERROR, '14') // RAP - Login error
      .addMetric(CALCULATED_METRICS.RAP_OTHER, '15') // RAP - Other
      .addMetric(CALCULATED_METRICS.RAP_SIN, '16')
      .addMetric(CALCULATED_METRICS.RAP_INFO_MISSING, '17')
      .addMetric(CALCULATED_METRICS.RAP_SECUREKEY, '18')
      .addMetric(CALCULATED_METRICS.RAP_OTHER_LOGIN, '19')
      .addMetric(CALCULATED_METRICS.RAP_GC_KEY, '20')
      .addMetric(CALCULATED_METRICS.RAP_INFO_WRONG, '21')
      .addMetric(CALCULATED_METRICS.RAP_SPELLING, '22')
      .addMetric(CALCULATED_METRICS.RAP_ACCESS_CODE, '23')
      .addMetric(CALCULATED_METRICS.RAP_LINK_NOT_WORKING, '24')
      .addMetric(CALCULATED_METRICS.RAP_404, '25')
      .addMetric(CALCULATED_METRICS.RAP_BLANK_FORM, '26')
      .addMetric(CALCULATED_METRICS.PROV_AB, '28')
      .addMetric(CALCULATED_METRICS.PROV_ON, '29')
      .setGlobalFilters([
        { type: 'segment', segmentId: SEGMENTS.cra },
        { type: 'dateRange', dateRange: formattedDate },
      ])
      .setSettings({
        nonesBehavior: 'return-nones',
        countRepeatInstances: true,
      })
      .build();

    // todo: figure out better way to handle timeouts, retries, etc
    const results = await withTimeout<any>(
      () => this.client.getReport(overallMetricsQuery),
      25000
    )();

    // console.log(results);
    // console.log(results.body.rows);

    return (
      results.body.rows
        // need to filter out extra day from bouncerate bug
        .filter(({ value }) => {
          const rowDate = dayjs(value).utc(true).toDate();
          const startDate = dayjs(dateRange.start).utc(true).toDate();
          return rowDate >= startDate;
        })
        .reduce((parsedResults, row) => {
          const date = dayjs(row.value).utc(true).toDate();

          const newDateData = {
            _id: new Types.ObjectId(),
            date,
            visits: row.data[0],
            visitors: row.data[1],
            views: row.data[2],
            average_time_spent: row.data[3], // this is probably the wrong metric
            dyf_submit: row.data[4],
            dyf_yes: row.data[5],
            dyf_no: row.data[6],
            bouncerate: row.data[7],
            rap_initiated: row.data[8],
            rap_completed: row.data[9],
            nav_menu_initiated: row.data[10],
            rap_cant_find: row.data[11],
            rap_login_error: row.data[12],
            rap_other: row.data[13],
            rap_sin: row.data[14],
            rap_info_missing: row.data[15],
            rap_securekey: row.data[16],
            rap_other_login: row.data[17],
            rap_gc_key: row.data[18],
            rap_info_wrong: row.data[19],
            rap_spelling: row.data[20],
            rap_access_code: row.data[21],
            rap_link_not_working: row.data[22],
            rap_404: row.data[23],
            rap_blank_form: row.data[24],
            prov_ab: row.data[25],
            prov_on: row.data[26],
          };

          return [...parsedResults, newDateData];
        }, [])
    );
  }

  async getPageMetrics(dateRange: {
    start: string;
    end: string;
  }): Promise<Overall[]> {
    // todo: better way to handle dates / allow single dates
    if (!this.client) {
      await this.initClient();
    }

    const formattedDate = `${dateRange.start}/${dateRange.end}`;
    console.log(formattedDate);

    // Todo: Create a "registry" of prebuilt queries somewhere?
    //  Also modify query builder to allow for passing an array of metrics & handle columnIds automatically
    const pageMetricsQuery = this.queryBuilder
      .setDimension('variables/evar50')
      .addMetric('metrics/event51', '2', ['0'])
      .addMetric('metrics/event51', '3', ['1'])
      .addBreakdownMetricFilter('variables/evar19', '4116743888', '0')
      .addBreakdownMetricFilter('variables/evar19', '1177133533', '1')
      .setGlobalFilters([
        { type: 'segment', segmentId: SEGMENTS.cra },
        { type: 'dateRange', dateRange: formattedDate },
      ])
      .setSettings({
        nonesBehavior: 'return-nones',
        countRepeatInstances: true,
        limit: 20000,
      })
      .toJSON();

    console.log(pageMetricsQuery);

    // todo: figure out better way to handle timeouts, retries, etc
    let results = await withTimeout<any>(
      () => this.client.getReport(pageMetricsQuery),
      25000
    )();

    results = getArraySeperated(results.body);
    results = sortArrayDesc(results);

    // console.log(results);
    // console.log(results.body.rows);

    return results;
  }
}
