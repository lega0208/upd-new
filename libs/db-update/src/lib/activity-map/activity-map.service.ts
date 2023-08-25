import { AnyBulkWriteOperation } from 'mongodb';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AAItemId, DbService, PageMetrics, Url } from '@dua-upd/db';
import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { ActivityMapMetrics, IAAItemId } from '@dua-upd/types-common';
import { BlobStorageService } from '@dua-upd/blob-storage';
import {
  ActivityMapResult,
  AdobeAnalyticsService,
  DateRange,
  queryDateFormat,
  singleDatesFromDateRange,
} from '@dua-upd/external-data';
import { arrayToDictionary, prettyJson, today } from '@dua-upd/utils-common';
import chalk from 'chalk';
import { Types } from 'mongoose';

dayjs.extend(utc);

interface ActivityMapEntry {
  title: string;
  data: ActivityMapMetrics[];
  itemId: string;
}

@Injectable()
export class ActivityMapService {
  constructor(
    private adobeAnalyticsService: AdobeAnalyticsService,
    private logger: ConsoleLogger,
    private db: DbService,
    @Inject(BlobStorageService.name) private blob: BlobStorageService
  ) {}

  async updateActivityMap(dateRange?: DateRange) {
    try {
      const latestDateResult = () =>
        this.db.collections.pageMetrics
          .findOne(
            { activity_map: { $exists: true, $not: { $size: 0 } } },
            { date: 1 }
          )
          .sort({ date: -1 })
          .exec();

      const queriesDateRange = dateRange || {
        start: dayjs
          .utc((await latestDateResult())?.['date'])
          .add(1, 'day')
          .format(queryDateFormat),
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

      type ActivityMapIntermediateResult = ActivityMapEntry & {
        itemIdTitle: string;
        pages: Types.ObjectId[];
        cleanUrl: string;
      };

      for (const dateRange of dateRanges) {
        let activityMapRecords: ActivityMapEntry[] = [];
        activityMapRecords = (await this.getPageActivityMap(dateRange)).flat();

        const activityMapDict = arrayToDictionary(activityMapRecords, 'itemId');

        const existingItems = await this.db.collections.aaItemIds.find({
          type: 'activityMapTitle',
          itemId: { $in: Object.keys(activityMapDict) },
        });

        const existingItemsDict = arrayToDictionary(existingItems, 'itemId');

        const noMatchActivityMapRecords = activityMapRecords.filter(
          (rec) => !existingItemsDict[rec.itemId]
        );

        await this.upsertValidItemIds(noMatchActivityMapRecords, dateRange);

        const itemIdDocs = await this.db.collections.aaItemIds.find({
          type: 'activityMapTitle',
          itemId: { $in: Object.keys(activityMapDict) },
        });

        const newExistingItemsDict = arrayToDictionary(itemIdDocs, 'itemId');

        const resultsWithRefs = activityMapRecords
          .map((activityMapResults) => {
            const itemIdData = newExistingItemsDict[activityMapResults.itemId];
            if (!itemIdData) return activityMapResults;

            const uniquePageStrings = [
              ...new Set(itemIdData.pages.map((page) => page.toString())),
            ];
            const pages = uniquePageStrings.map(
              (page) => new Types.ObjectId(page)
            );

            const itemIdTitle = itemIdData?.value;
            delete activityMapResults.itemId;

            return {
              ...activityMapResults,
              itemIdTitle,
              pages,
            };
          })
          .filter(
            (results) => 'pages' in results && results.pages.length > 0
          ) as ActivityMapIntermediateResult[];

        const pageObjectIds = resultsWithRefs
          .flatMap(({ pages }) => pages)
          .map((page) => new Types.ObjectId(page));

        const pageMetricsToMatch = await this.db.collections.pageMetrics
          .find(
            {
              date: dayjs.utc(dateRange.start).toDate(),
              page: {
                $in: pageObjectIds,
              },
            },
            { url: 1, page: 1, title: 1 }
          )
          .lean()
          .exec();

        const pageMetricsUrlDict = arrayToDictionary(
          pageMetricsToMatch,
          'page',
          true
        );

        this.logger.log(
          `Found ${pageMetricsToMatch.length} matching page metrics records`
        );

        const bulkOperations: AnyBulkWriteOperation<PageMetrics>[] = [];

        for (const activityMap of resultsWithRefs) {
          const { data, pages } = activityMap;

          for (const page of pages) {
            const pageMetricsMatch = pageMetricsUrlDict[page.toString()];

            const dataObject = data.reduce((records, item) => {
              let linkKey = item?.link;

              if (
                // Check if the link is a pdf, txt, or brf file
                RegExp(
                  /^(http:\/\/|https:\/\/)www.canada.ca\/.*\.(pdf|txt|brf)$/
                ).test(linkKey)
              ) {
                const linkParts = item?.link.split('/');
                linkKey = linkParts[linkParts.length - 1];

                records[linkKey] = {
                  ...item,
                  link: linkKey,
                };
              } else if (!records[linkKey]) {
                records[linkKey] = item;
              }

              return records;
            }, {}) as Record<string, ActivityMapMetrics>;

            const updatedData = Object.values(dataObject);

            if (pageMetricsMatch) {
              bulkOperations.push({
                updateOne: {
                  filter: { _id: pageMetricsMatch._id },
                  update: {
                    $addToSet: {
                      activity_map: { $each: updatedData },
                    },
                  },
                  upsert: true,
                },
              });
            }
          }
        }

        if (bulkOperations.length) {
          await this.db.collections.pageMetrics.bulkWrite(bulkOperations, {
            ordered: false,
          });
          this.logger.log(
            `Upserted ${resultsWithRefs.length}/${activityMapRecords.length} records`
          );
        }

        if (!existsSync('./logs')) {
          await mkdir('./logs');
        }

        await writeFile(
          `./logs/activityMap-${dateRange.start.replace(
            /^(\d{4}-\d{2}-\d{2}).+/,
            '$1'
          )}.json`,
          prettyJson(resultsWithRefs),
          'utf8'
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  /* ***************************************************************************
   * Get Activity Map ItemIds
   * **************************************************************************/

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

  async getPageActivityMap(dateRange?: DateRange) {
    const activityMapItemIds: IAAItemId[] = await this.getItemIds(dateRange);

    const activityMapData: ActivityMapResult[] =
      await this.adobeAnalyticsService.getPageActivityMap(
        dateRange,
        activityMapItemIds
      );

    return await this.parseActivityMap(activityMapData, activityMapItemIds);
  }

  /* ***************************************************************************
   * Parse Activity Map
   * **************************************************************************/

  async parseActivityMap(
    activityMapData: ActivityMapResult[],
    activityMapItemIds: IAAItemId[]
  ): Promise<ActivityMapEntry[]> {
    const records: ActivityMapEntry[] = [];

    for (const obj of activityMapData) {
      const { url, ...data } = obj;
      const filteredData = Object.entries(data).filter(
        ([key, value]) =>
          key !== 'date' && typeof value === 'number' && value !== 0
      );

      for (const [key, clicks] of filteredData) {
        const matchingId = activityMapItemIds.find((id) => id.itemId === key);

        if (matchingId) {
          const existingRecord = records.find((rec) => rec.itemId === key);
          const dataObj = { link: url, clicks: Number(clicks) };

          if (existingRecord) {
            existingRecord.data.push(dataObj);
            existingRecord.data.sort((a, b) => b.clicks - a.clicks);
          } else {
            records.push({
              title: matchingId.value,
              data: [dataObj],
              itemId: key,
            });
          }
        }
      }
    }

    return records;
  }

  async upsertValidItemIds(
    records: ActivityMapEntry[],
    dateRange
  ): Promise<void> {
    try {
      if (records.length) {
        const bulkOperations: AnyBulkWriteOperation<AAItemId>[] = [];
        const noMetricsMatchSet = new Set();
        for (const record of records) {
          const { title, itemId } = record;
          const matchingRecords =
            (await this.db.collections.urls.find({
              all_titles: title,
            })) || [];

          if (matchingRecords.length === 0) {
            noMetricsMatchSet.add({
              title,
              itemId,
            });

            continue;
          }

          bulkOperations.push({
            updateOne: {
              filter: {
                type: 'activityMapTitle',
                itemId: itemId,
              },
              update: {
                value: title,
                pages: matchingRecords.map((rec) => rec.page),
              },
              upsert: true,
            },
          });
        }

        if (bulkOperations.length > 0) {
          await this.db.collections.aaItemIds.bulkWrite(bulkOperations);
          this.logger.log(`Upserted ${bulkOperations.length} itemids`);
        } else {
          this.logger.log('No itemids to upsert');
        }

        if (noMetricsMatchSet.size > 0) {
          try {
            if (!existsSync('./logs')) {
              await mkdir('./logs');
            }

            await writeFile(
              `./logs/activityMap-itemId-noMatch-${dateRange.start.replace(
                /^(\d{4}-\d{2}-\d{2}).+/,
                '$1'
              )}.json`,
              prettyJson([...noMetricsMatchSet]),
              'utf8'
            );
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (error) {
      console.error(`Error in upsertActivityMap: ${error}`);
    }
  }
}
