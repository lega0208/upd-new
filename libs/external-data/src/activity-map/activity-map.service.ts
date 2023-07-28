import { AnyBulkWriteOperation } from 'mongodb';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import * as path from 'path';
import * as readline from 'readline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Model } from 'mongoose';

import { AAItemId, DbService, PageMetrics, Url } from '@dua-upd/db';
import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { ActivityMapMetrics, IAAItemId } from '@dua-upd/types-common';
import { BlobStorageService, StorageContainer } from '@dua-upd/blob-storage';
import {
  ActivityMapResult,
  AdobeAnalyticsService,
} from '../lib/adobe-analytics/adobe-analytics.service';
import { arrayToDictionary, prettyJson, today } from '@dua-upd/utils-common';
import chalk from 'chalk';
import { DateRange, queryDateFormat } from '../lib/adobe-analytics';
import { singleDatesFromDateRange } from '../lib/utils';

dayjs.extend(utc);

type ActivityMapEntry = Record<string, { link: string; clicks: number }[]>;

const CSV_FILENAME = path.join(__dirname, 'all-titles-urls.csv');
const MAX_FILENAMES = 2;

interface Filename {
  itemId: string;
  data: string;
  date: string;
}

interface Records {
  title: string;
  data: ActivityMapMetrics[];
  itemId: string;
}

interface CSVRecord {
  pageUrl: string;
  pageTitle: string;
}

@Injectable()
export class ActivityMapService {
  constructor(
    private adobeAnalyticsService: AdobeAnalyticsService,
    private logger: ConsoleLogger,
    private db: DbService,
    @Inject(BlobStorageService.name) private blob: BlobStorageService
  ) {}

  async processActivityMap(dateRange?: DateRange) {
    try {
      const queriesDateRange = dateRange || {
        start: dayjs.utc('2022-12-31').add(1, 'day').format(queryDateFormat),
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
        const blobContainer = await this.blob.blobModels.aa_raw.getContainer();
      
        const matchingFilenames = await this.getMatchingFilenames(
          blobContainer,
          MAX_FILENAMES,
          dayjs(dateRange.start).format('YYYY-MM-DD')
        );
  
        let activityMapRecords: Records[] = [];
  
        if (matchingFilenames && matchingFilenames.length > 0) {
          this.logger.log(`Retrieving ${matchingFilenames[0].date} data from blob storage`);
          
          const records = await Promise.all(
            matchingFilenames.map(filename =>
              this.getActivityMapRecords(blobContainer, filename)
            )
          );
  
          activityMapRecords = records.flat();
        } else {
          this.logger.log('No matching files in blob storage. Fetching data from Adobe Analytics.');
          activityMapRecords = (await this.getPageActivityMap(dateRange)).flat();
        }

        const activityMapDict = arrayToDictionary(activityMapRecords, 'itemId');
        
        const existingItems = await this.db.collections.aaItemIds.find({
          type: 'activityMapTitle',
          itemId: { $in: Object.keys(activityMapDict) },
        });

        const existingItemsDict = arrayToDictionary(existingItems, 'itemId');
  
        const filteredActivityMapRecords = activityMapRecords.filter(
          (rec) => existingItemsDict[rec.itemId]
        );

        const noMatchActivityMapRecords = activityMapRecords.filter(
          (rec) => !existingItemsDict[rec.itemId]
        );
  
        if (filteredActivityMapRecords.length === 0) {
          this.logger.log('No new records to upsert.');
          return;
        }
  
        await this.populateIdCollection(noMatchActivityMapRecords, dateRange);

        // Use the page field in aaItemIds collection to get the page field in page_metrics collection, and then upsert
        const bulkOperations: AnyBulkWriteOperation<PageMetrics>[] = [];
        const formattedDate = dayjs(dateRange.start).utc().startOf('day').toDate();

        for (const record of activityMapRecords) {
          const { title, itemId, data } = record;
          
          const existingRecord = await this.db.collections.aaItemIds.findOne({
            type: 'activityMapTitle',
            itemId,
          });

          if (existingRecord) {
            const page = existingRecord.page;
            const existingPageMetric = await this.db.collections.pageMetrics.findOne({
              date: formattedDate,
              page,
            });

            if (existingPageMetric) {
              bulkOperations.push({
                updateOne: {
                  filter: {
                    date: formattedDate,
                    page,
                  },
                  update: {
                    $addToSet: {
                      activity_map: { $each: data },
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
          this.logger.log(`Upserted ${filteredActivityMapRecords.length}/${activityMapRecords.length} records`);
        }

        if (!existsSync('./logs')) {
          await mkdir('./logs');
        }

        await writeFile(
          `./logs/activityMap-${dateRange.start.replace(/^(\d{4}-\d{2}-\d{2}).+/, '$1')}.json`,
          prettyJson(filteredActivityMapRecords),
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

  /* ***************************************************************************
   * Upsert Activity Map (From File)
   * **************************************************************************/

  async upsertFilePageActivityMap(dateRange?: DateRange) {
    const csv: Map<string, Set<string>> = await this.runCSVAnalysis();

    // get activityMap-2023-01-02.json file from logs folder and parse it
    const activityMapFile = await readFile(
      `./logs/activityMap-2023-01-02.json`,
      'utf8'
    );

    const activityMaps: Records[] = JSON.parse(activityMapFile);

    let zeroMatchCount = 0; // Counter for zero matches
    let matchedCount = 0; // Counter for matched items
    let notFoundCount = 0; // Counter for items not found in CSV
    let matchedDBCount = 0; // Counter for items matched in DB

    for (const activityMap of activityMaps) {
      const { title, itemId } = activityMap;

      const match = await this.db.collections.urls.find({ all_titles: title });

      if (match.length === 0) {
        const existsCSV = csv.get(title);

        if (existsCSV) {
          const urlsToSearch = Array.from(existsCSV.values());

          const urlMatches = await this.db.collections.urls.find({
            url: { $in: urlsToSearch },
          });

          if (urlMatches.length === 0) {
            zeroMatchCount++;
          } else {
            matchedCount++;
          }
        } else {
          notFoundCount++;
          this.logger.log(`No match found for ${title}`);
        }
        // this.logger.log(`No match found for ${title}`);
      } else {
        matchedDBCount++;
      }

      // if (match.length > 1) {
      //   this.logger.log(`Multiple matches found for ${title}`);
      //   match.forEach((m) => this.logger.log(m.url));
      // }
    }

    this.logger.log(`Total zero matches: ${zeroMatchCount}`);
    this.logger.log(`Total matches: ${matchedCount}`);
    this.logger.log(`Total not found: ${notFoundCount}`);
    this.logger.log(`Total matched in DB: ${matchedDBCount}`);
  }

  /* ***************************************************************************
   * CSV Analysis
   * **************************************************************************/

  async runCSVAnalysis(): Promise<Map<string, Set<string>>> {
    const parsedCsv: Map<string, Set<string>> = new Map();

    const rl = readline.createInterface({
      input: createReadStream(CSV_FILENAME, 'utf8'),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const [pageTitle, pageUrl, visits] = this.parseCsvLine(line);

      const record: CSVRecord = {
        pageUrl,
        pageTitle,
      };

      const existingUrls = parsedCsv.get(record.pageTitle) || new Set<string>();
      existingUrls.add(record.pageUrl);
      parsedCsv.set(record.pageTitle, existingUrls);
    }

    this.logger.log(`Parsed CSV records: ${parsedCsv.size}`);

    return parsedCsv;
  }

  parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    values[1] = values[1].replace(/^"(.*)"$/, '$1');
    return values;
  }

  /* ***************************************************************************
   * Parse Activity Map (From Adobe Analytics)
   * **************************************************************************/

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
   * Upsert Activity Map (From Blob Storage)
   * **************************************************************************/

  async parseActivityMap(
    activityMapData: ActivityMapResult[],
    activityMapItemIds: IAAItemId[]
  ): Promise<Records[]> {
    const records: Records[] = [];

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

  async populateIdCollection(records: Records[], dateRange): Promise<void> {
    try {
      if (records.length) {
        const bulkOperations: AnyBulkWriteOperation<AAItemId>[] = [];
        const noMetricsMatchSet = new Set();

        for (const record of records) {
          const { title, itemId, data } = record;
          const existingRecord = await this.db.collections.urls.findOne({
            all_titles: title,
          });

          if (!existingRecord) {
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
                value: existingRecord.title,
                page: existingRecord.page,
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

  async getActivityMapRecords(
    blobContainer: StorageContainer,
    filenames: Filename
  ) {
    try {
      const blobModel = blobContainer.createBlobsClient({
        path: 'aa_raw',
        overwrite: false,
        compression: 'brotli',
      });
      return await this.getRecordsForFilename(blobModel, filenames);
    } catch (error) {
      console.error(`Error in getActivityMapRecords: ${error}`);
      return [];
    }
  }

  async getRecordsForFilename(blobModel, filename: Filename) {
    try {
      const blobActivityMap = blobModel.blob(filename.data);
      const blobItemId = blobModel.blob(filename.itemId);
      const [activityMapString, itemIdsString] = await Promise.all([
        blobActivityMap.downloadToString(),
        blobItemId.downloadToString(),
      ]);
      return this.parseBlobActivityMap(
        JSON.parse(activityMapString),
        JSON.parse(itemIdsString),
        filename.date
      );
    } catch (error) {
      console.error(`Error in getRecordsForFilename: ${error}`);
      return [];
    }
  }

  parseBlobActivityMap(
    activityMapData: ActivityMapResult[],
    activityMapItemIds: IAAItemId[],
    date: string
  ) {
    const records = [];

    for (const activityMap of activityMapData) {
      const itemId = Object.keys(activityMap)[0];
      const matchingId = activityMapItemIds.find((id) => id.itemId === itemId);
      const data = activityMap[itemId];

      if (matchingId) {
        records.push({
          title: matchingId.value,
          data,
          itemId,
          date,
        });
      }
    }

    return records;
  }

  async getMatchingFilenames(
    blobContainer: StorageContainer,
    maxFilenames: number,
    start = '2023-01-01'
  ): Promise<Filename[]> {
    try {
      const filenames = await blobContainer.mapBlobs(
        (blob) => blob.name.split('/')[1],
        'aa_raw'
      );
      return this.findMatchingFilenames(filenames, maxFilenames, start);
    } catch (error) {
      console.error(`Error in getMatchingFilenames: ${error}`);
      return [];
    }
  }

  findMatchingFilenames(
    filenames: string[],
    maxFilenames: number,
    start
  ): Filename[] {
    const uniqueDates =
      Array.from(
        new Set(
          filenames
            .map((filename) => filename.match(start)?.[0])
            .filter((value) => !!value)
        )
      ) ||
      Array.from(
        new Set(
          filenames
            .map((filename) => filename.match(/(\d{4}-\d{2}-\d{2})/)?.[0])
            .filter((value) => !!value)
        )
      );

    const matchingFilenames: Filename[] = [];
    for (const date of uniqueDates) {
      const activityMapFilename = `activityMap_data_${date}.json.brotli`;
      const activityMapItemIdsFilename = `activityMap_itemIds_${date}.json.brotli`;
      if (
        filenames.includes(activityMapFilename) &&
        filenames.includes(activityMapItemIdsFilename)
      ) {
        matchingFilenames.push({
          itemId: activityMapItemIdsFilename,
          data: activityMapFilename,
          date: date,
        });
      }

      if (matchingFilenames.length >= maxFilenames) {
        break;
      }
    }

    return matchingFilenames;
  }
}
