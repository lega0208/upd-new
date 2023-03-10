import { ConsoleLogger, Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { prettyJson, today } from '@dua-upd/utils-common';
import { DbService } from '@dua-upd/db';
import {
  AdobeAnalyticsService,
  DateRange,
  queryDateFormat,
  singleDatesFromDateRange,
} from '@dua-upd/external-data';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

dayjs.extend(utc);

type ActivityMapEntry = Record<string, { link: string; clicks: number }[]>;

@Injectable()
export class ActivityMapService {
  constructor(
    private adobeAnalyticsService: AdobeAnalyticsService,
    private db: DbService,
    private logger: ConsoleLogger
  ) {}

  async getItemIds(dateRange: DateRange) {
    try {
      this.logger.log(
        chalk.blueBright(
          'Getting itemIds for dateRange: ',
          prettyJson(dateRange)
        )
      );

      const itemIds = await this.adobeAnalyticsService.getActivityMapItemIds(
        dateRange
      );

      this.logger.log(
        chalk.green(`Successfully received ${itemIds.length} itemIds.`)
      );

      return itemIds;
    } catch (err) {
      this.logger.error(chalk.red('Error updating itemIds:'));
      this.logger.error(chalk.red(err.stack));
    }
  }

  async upsertPageActivityMap(dateRange?: DateRange) {
    const queriesDateRange = dateRange || {
      start: dayjs.utc('2022-01-31').add(1, 'day').format(queryDateFormat),
      end: today().subtract(1, 'day').endOf('day').format(queryDateFormat),
    };

    const queryStart = dayjs.utc(queriesDateRange.start);
    const queryEnd = dayjs.utc(queriesDateRange.end);

    if (queryEnd.isBefore(queryStart)) {
      this.logger.log('Page activity map already up-to-date.');
      return;
    }

    const dateRanges = (
      singleDatesFromDateRange(
        queriesDateRange,
        queryDateFormat,
        true
      ) as string[]
    )
      .map((date: string) => ({
        start: date,
        end: dayjs.utc(date).add(1, 'day').format(queryDateFormat),
      }))
      .filter(
        (dateRange) =>
          dayjs.utc(dateRange.start).startOf('day') !==
          dayjs.utc().startOf('day')
      );

    for (const dateRange of dateRanges) {
      const itemIds = await this.getItemIds(dateRange);

      const results = await this.adobeAnalyticsService.getPageActivityMap(
        dateRange,
        itemIds
      );

      const result: ActivityMapEntry = {};

      for (const obj of results) {
        for (const [key, value] of Object.entries(obj)) {
          if (
            key === 'date' ||
            key === 'url' ||
            typeof value !== 'number' ||
            value === 0
          ) {
            continue;
          }
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push({ link: obj.url as string, clicks: value });
        }
      }

      const data = Object.entries(result)
      .map(([key, value]) => ({
        [key]: value.sort((a, b) => b.clicks - a.clicks),
      })) as ActivityMapEntry[];

      console.log('data.length:');
      console.log(data.length);

      try {
        if (!existsSync('./logs')) {
          await mkdir('./logs');
        }

        await writeFile(
          `./logs/activityMap-${dateRange.start.replace(
            /^(\d{4}-\d{2}-\d{2}).+/,
            '$1'
          )}.json`,
          prettyJson([...data]),
          'utf8'
        );
      } catch (e) {
        console.error(e);
      }
    }
  }
}