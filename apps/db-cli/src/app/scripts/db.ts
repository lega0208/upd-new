/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from 'chalk';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { Types, type mongo } from 'mongoose';
import { difference, filterObject, omit, uniq } from 'rambdax';
import { utils, writeFile as writeXlsx } from 'xlsx';
import {
  AAItemId,
  DbService,
  Page,
  PageMetrics,
  PagesList,
  Readability,
} from '@dua-upd/db';
import { DbUpdateService, processHtml, UrlsService } from '@dua-upd/db-update';
import {
  AirtableClient,
  SearchAnalyticsClient,
  singleDatesFromDateRange,
} from '@dua-upd/external-data';
import {
  TimingUtility,
  arrayToDictionary,
  arrayToDictionaryFlat,
  arrayToDictionaryMultiref,
  dayjs,
  logJson,
  prettyJson,
} from '@dua-upd/utils-common';
import { IFeedback, IPage, IReadability, IUrl } from '@dua-upd/types-common';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { RunScriptCommand } from '../run-script.command';
import { startTimer } from './utils/misc';
import { outputExcel, outputJson } from './utils/output';
import { spawn } from 'child_process';
import { preprocessCommentWords } from '@dua-upd/feedback';

export const recalculateViews = async (
  db: DbService,
  updateService: DbUpdateService,
) => {
  return await updateService.recalculateViews();
};

export const updateAirtable = async (
  db: DbService,
  updateService: DbUpdateService,
) => {
  return await updateService.updateUxData(true);
};

export const addMissingPageMetricsRefs = async (db: DbService) => {
  await db.addMissingAirtableRefsToPageMetrics();
};

export async function uploadFeedback(_, __, ___, blob: BlobStorageService) {
  const time = startTimer('uploadFeedback');
  const feedback = await readFile(
    'feedback_cleanest_2021-04-01_2023-04-16.json',
    'utf-8',
  );

  await blob.blobModels.feedback
    .blob('feedback_2021-04-01_2023-04-16.json')
    .uploadFromString(feedback);

  time();
}

export async function downloadFeedbackSnapshot(
  _,
  __,
  ___,
  blob: BlobStorageService,
) {
  const time = startTimer('downloadFeedback');
  const filename = 'feedback_2021-04-01_2023-04-16.json';

  await blob.blobModels.feedback
    .blob(filename)
    .downloadToFile('feedback_2021-04-01_2023-04-16.json', {
      blockSize: 1_048_576,
      concurrency: 6,
    });

  time();
}

export async function repopulateFeedbackFromSnapshot(
  db: DbService,
  __,
  ___,
  blob: BlobStorageService,
) {
  const filename = 'feedback_2021-04-01_2023-04-16.json';

  const feedback = <Omit<IFeedback, '_id'>[]>JSON.parse(
    await blob.blobModels.feedback.blob(filename).downloadToString({
      blockSize: 1_048_576,
      concurrency: 6,
    }),
  ).map(
    (feedback) =>
      ({
        _id: new Types.ObjectId(),
        ...feedback,
      }) as IFeedback,
  );

  await db.collections.feedback.deleteMany({});

  await db.collections.feedback.insertMany(feedback);
}

export async function syncUrlsCollection() {
  const urlsService = (<RunScriptCommand>this).inject<UrlsService>(UrlsService);

  await urlsService.updateUrls();
}

// Don't run this unless you know what you're doing
export async function uploadUrlsCollection() {
  const urlsService = (<RunScriptCommand>this).inject<UrlsService>(UrlsService);

  await urlsService.saveCollectionToBlobStorage(true);
}

export async function uploadFeedback2(_, __, ___, blob: BlobStorageService) {
  const time = startTimer('uploadFeedback');
  const feedback = await readFile(
    'feedback_2023-04-17_2023-06-25.json',
    'utf-8',
  );

  await blob.blobModels.feedback
    .blob('feedback_2023-04-17_2023-06-25.json')
    .uploadFromString(feedback);

  time();
}

export async function repopulateFeedbackFromSnapshot2(
  db: DbService,
  __,
  ___,
  blob: BlobStorageService,
) {
  const filename = 'feedback_2023-04-17_2023-06-25.json';

  const feedback = <Omit<IFeedback, '_id'>[]>JSON.parse(
    await blob.blobModels.feedback.blob(filename).downloadToString(),
  ).map(
    (feedback) =>
      ({
        _id: new Types.ObjectId(),
        ...feedback,
      }) as IFeedback,
  );

  await db.collections.feedback.deleteMany({
    date: { $gte: new Date('2023-04-17'), $lte: new Date('2023-06-25') },
  });

  await db.collections.feedback.insertMany(feedback);
}

export async function addUrlTitlesToAllTitles(db: DbService) {
  const urls = await db.collections.urls
    .find({ title: { $exists: true } })
    .lean()
    .exec();

  const writeOps: mongo.AnyBulkWriteOperation<IUrl>[] = urls.map((url) => ({
    updateOne: {
      filter: { _id: url._id },
      update: {
        $addToSet: {
          all_titles: url.title,
        },
      },
    },
  }));

  await db.collections.urls.bulkWrite(writeOps);

  console.log('Current titles successfully added to all_titles.');
}

export async function cleanUrlsTitles(db: DbService) {
  const urls = await db.collections.urls
    .find({ title: { $exists: true } })
    .lean()
    .exec();

  const cleanTitle = (title: string) =>
    title
      .replace(/ - Canada\.ca\s*$/i, '')
      .trim()
      .replaceAll(/\s+/g, ' ');

  const writeOps: mongo.AnyBulkWriteOperation<IUrl>[] = urls.map((url) => ({
    updateOne: {
      filter: { _id: url._id },
      update: {
        $set: {
          title: cleanTitle(url.title),
          all_titles: url.all_titles.map(cleanTitle),
        },
      },
    },
  }));

  await db.collections.urls.bulkWrite(writeOps);

  console.log('Titles successfully cleaned 🧹🧹');
}

export async function repopulateGscOverallSearchTerms() {
  const dbUpdateService = (<RunScriptCommand>this).inject<DbUpdateService>(
    DbUpdateService,
  );

  console.time('repopulateGscOverallSearchTerms');

  const sixteenMonthsAgo = dayjs().subtract(16, 'months').format('YYYY-MM-DD');

  console.log('16 months ago: ', sixteenMonthsAgo);

  await dbUpdateService.upsertOverallGscMetrics(
    singleDatesFromDateRange(
      {
        start: sixteenMonthsAgo,
        end: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      },
      false,
      true,
    ) as Date[],
  );

  console.timeEnd('repopulateGscOverallSearchTerms');
}

export async function repopulateGscPageSearchTerms(db: DbService) {
  console.time('repopulateGscPageSearchTerms');
  const client = new SearchAnalyticsClient();

  const sixteenMonthsAgo = dayjs().subtract(16, 'months').format('YYYY-MM-DD');

  console.log('16 months ago: ', sixteenMonthsAgo);

  const bulkWriteOps = [];

  const results = (
    await client.getPageMetrics({
      start: sixteenMonthsAgo,
      end: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    })
  ).flat();

  for (const result of results) {
    bulkWriteOps.push({
      updateOne: {
        filter: {
          url: result.url,
          date: result.date,
        },
        update: {
          $set: result,
        },
      },
    });
  }

  while (bulkWriteOps.length) {
    console.log('write ops remaining: ', bulkWriteOps.length);

    const ops = bulkWriteOps.splice(0, 1000);

    await db.collections.pageMetrics.bulkWrite(ops, { ordered: false });
  }

  console.timeEnd('repopulateGscPageSearchTerms');
}

// repopulate titles from blobs because of bug causing mangled titles
export async function repairUrlTitles(db: DbService) {
  console.time('repairUrlTitles');
  const blobService = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name,
  );

  // mangles `a`, compares `b`, and returns true if there's a match
  const isMangled = (a: string, b: string) => {
    const aMangled = a.replace(/s{2,}/g, ' ').replace(/\s{2,}/g, ' ');

    return aMangled === b;
  };

  const testUrlWithBlob = (
    await db.collections.urls.mapBlobs(
      blobService.blobModels.urls,
      {
        $and: [{ title: { $ne: null } }, { title: { $ne: '' } }],
        latest_snapshot: { $exists: true },
        hashes: { $not: { $size: 0 } },
      },
      (urlWithBlob): mongo.AnyBulkWriteOperation<IUrl> => {
        const htmlData = processHtml(urlWithBlob.blobContent);

        if (!htmlData) {
          return;
        }

        const blobTitle = htmlData.title;

        const newAllTitles = [
          ...new Set(
            [blobTitle, urlWithBlob.title, ...urlWithBlob.all_titles].map(
              (title) => title.trim().replace(/\s+/g, ' '),
            ),
          ),
        ];

        const couldBeMangled = newAllTitles.filter((title) =>
          title.includes('ss'),
        );

        const cleanAllTitles = newAllTitles.filter(
          (title) =>
            !couldBeMangled.some((comparison) => isMangled(comparison, title)),
        );

        return {
          updateOne: {
            filter: { _id: urlWithBlob._id },
            update: {
              $set: {
                title: blobTitle,
                all_titles: cleanAllTitles,
              },
            },
          },
        };
      },
    )
  ).filter(Boolean) as mongo.AnyBulkWriteOperation<IUrl>[];

  const results = await db.collections.urls.bulkWrite(testUrlWithBlob);

  console.log(`modified: ${results.nModified}`);

  console.timeEnd('repairUrlTitles');
}

export async function updatePageTitlesFromUrls(db: DbService) {
  // group by page -> find multiple titles
  // if multiple titles, can't know which title is correct
  const titles = await db.collections.urls.aggregate<{
    _id: Types.ObjectId;
    titles: string[];
    titlesCount: number;
  }>([
    {
      $match: {
        title: { $ne: null },
        $or: [{ is_404: false }, { is_404: null }],
      },
    },
    {
      $group: {
        _id: '$page',
        titles: { $addToSet: '$title' },
      },
    },
    {
      $addFields: {
        titlesCount: {
          $size: '$titles',
        },
      },
    },
    {
      $match: {
        titlesCount: { $gt: 1 },
      },
    },
  ]);

  const multiPageTitles = titles.map(({ _id }) => _id);

  const pagesTitles = await db.collections.urls
    .aggregate<{
      _id: Types.ObjectId;
      title: string;
    }>()
    .match({
      $and: [{ page: { $exists: true } }, { page: { $nin: multiPageTitles } }],
      title: { $exists: true, $ne: 'Forbidden' },
      is_404: { $not: { $eq: true } },
    })
    .group({
      _id: '$page',
      title: { $first: '$title' },
    })
    .exec();

  const currentPageTitles = await db.collections.pages
    .find({}, { title: 1 })
    .exec();

  const currentPageTitlesDict = arrayToDictionary(currentPageTitles, '_id');

  const pageTitleChanges: mongo.AnyBulkWriteOperation<Page>[] = pagesTitles
    .filter(
      ({ _id, title }) => currentPageTitlesDict[_id.toString()].title !== title,
    )
    .map(({ _id, title }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            title,
          },
        },
      },
    }));

  const results = await db.collections.pages.bulkWrite(pageTitleChanges, {
    ordered: false,
  });

  console.log(`modified: ${results.nModified}`);
}

export async function populateAllTitles(db: DbService) {
  const blobService = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name,
  );

  const allTitles: Record<string, string[]> = JSON.parse(
    await blobService.blobModels.urls
      .blob('all-titles.json')
      .downloadToString(),
  );

  // clean/dedupe allTitles
  for (const url of Object.keys(allTitles)) {
    allTitles[url] = uniq(
      allTitles[url].map((title) =>
        title
          .replace(/\s+/g, ' ')
          .replace(/ [-–] Canada\.ca/, '')
          .trim(),
      ),
    );
  }

  const urls = await db.collections.urls.find({}, {}).lean().exec();

  const bulkWriteOps: mongo.AnyBulkWriteOperation<IUrl>[] = urls
    .filter(
      (url) =>
        (!url.all_titles && url.title) ||
        (url.all_titles?.length !== allTitles[url.url]?.length &&
          difference(allTitles[url.url] || [], url.all_titles || []).length >
            0),
    )
    .map((url) => {
      const titles = allTitles[url.url]
        ? [...allTitles[url.url], url.title]
        : [url.title];

      return {
        updateOne: {
          filter: { _id: url._id },
          update: {
            $addToSet: {
              all_titles: {
                $each: titles,
              },
            },
          },
        },
      };
    });

  const bulkWriteResults = await db.collections.urls.bulkWrite(bulkWriteOps);

  console.log(`${bulkWriteResults.modifiedCount} documents updated`);
}

export async function exportPreMigrationPageData(db: DbService) {
  console.time('exportPreMigrationPageData');
  const dateRanges = {
    lastYear: {
      start: new Date('2022-01-01'),
      end: new Date('2022-12-31'),
    },
    lastQuarter: {
      start: new Date('2023-04-01'),
      end: new Date('2023-06-30'),
    },
    lastMonth: {
      start: new Date('2023-07-01'),
      end: new Date('2023-07-31'),
    },
  };

  // comment out if this part already ran and you need to run the script again
  for (const [label, dateRange] of Object.entries(dateRanges)) {
    console.time(`pageRefs-${label}`);

    await db.validatePageMetricsRefs({
      date: {
        $gte: dateRange.start,
        $lte: dateRange.end,
      },
    });

    console.timeEnd(`pageRefs-${label}`);
  }

  const aggregations: (keyof typeof db.collections)[] = [
    'urls',
    'pages',
    'tasks',
    'projects',
  ];

  const pages = (await db.collections.pages
    .find({}, { title: 1, url: 1, all_urls: 1, tasks: 1, projects: 1 })
    .lean()
    .exec()) as (Page &
    Required<{ _id: Types.ObjectId }> & { all_urls: string[] })[];

  const pagesDict = arrayToDictionary(pages, '_id');

  const tasks = await db.collections.tasks
    .find({}, { title: 1, pages: 1 })
    .lean()
    .exec();

  const tasksDict = arrayToDictionary(tasks, '_id');

  const projects = await db.collections.projects
    .find({}, { title: 1, pages: 1 })
    .lean()
    .exec();

  const projectsDict = arrayToDictionary(projects, '_id');

  const excelWorkbook = utils.book_new();

  for (const aggregation of aggregations) {
    console.log(`Aggregation: ${aggregation}`);

    const metricsRefField = ['pages', 'urls'].includes(aggregation)
      ? aggregation.replace('s', '')
      : aggregation;

    console.log(metricsRefField);

    const urlsGroup =
      aggregation === 'urls'
        ? {
            page: {
              $first: '$page',
            },
            tasks: {
              $first: '$tasks',
            },
            projects: {
              $first: '$projects',
            },
          }
        : {};

    for (const [label, dateRange] of Object.entries(dateRanges)) {
      console.log(`Date range: ${label}`);

      console.time(`${aggregation}-${label}`);

      const urlsProjection =
        aggregation === 'urls' ? { page: 1, tasks: 1, projects: 1 } : {};

      const output = await db.collections.pageMetrics
        .aggregate<{
          _id: Types.ObjectId;
          visits: number;
          page?: Types.ObjectId;
          tasks?: Types.ObjectId[];
          projects?: Types.ObjectId[];
        }>()
        .project({
          date: 1,
          [metricsRefField]: 1,
          visits: 1,
          ...urlsProjection,
        })
        .match({
          date: {
            $gte: dateRange.start,
            $lte: dateRange.end,
          },
          [metricsRefField === 'url' ? 'page' : metricsRefField]: {
            $exists: true,
          },
        })
        .unwind(metricsRefField)
        .group({
          _id: `$${metricsRefField}`,
          visits: { $sum: '$visits' },
          ...urlsGroup,
        })
        .exec()
        .then((data) => {
          switch (aggregation) {
            case 'urls':
              return data.map((metrics) => ({
                url: metrics._id,
                visits: metrics.visits,
                pageId: metrics.page.toString(),
                pageTitle: pagesDict[metrics.page.toString()].title,
                taskIds: metrics.tasks?.map((taskId) => taskId.toString()),
                taskTitles: metrics.tasks
                  ?.map((taskId) => tasksDict[taskId?.toString()]?.title)
                  .join(', '),
                projectIds: metrics.projects?.map((projectId) =>
                  projectId.toString(),
                ),
                projectTitles: metrics.projects
                  ?.map(
                    (projectId) => projectsDict[projectId?.toString()]?.title,
                  )
                  .join(', '),
              }));

            case 'pages':
              return data.map((page) => ({
                ...page,
                _id: page._id.toString(),
                title: pagesDict[page._id.toString()].title,
                url: pagesDict[page._id.toString()].url,
                all_urls: pagesDict[page._id.toString()].all_urls.join(', '),
              }));

            case 'tasks':
              return data.map((task) => {
                try {
                  return {
                    ...task,
                    _id: task._id.toString(),
                    title: tasksDict[task._id.toString()].title,
                  };
                } catch (err) {
                  console.error('task:');
                  console.error(task._id.toString());
                  console.error();
                  console.error(err);
                }
              });

            case 'projects':
              return data.map((project) => ({
                ...project,
                _id: project._id.toString(),
                title: projectsDict[project._id.toString()].title,
              }));
          }
        });

      if (!existsSync('./pre-migration')) {
        await mkdir('./pre-migration');
      }

      const outputPath = `./pre-migration/${aggregation}-${label}.json`;

      await writeFile(outputPath, prettyJson(output), 'utf8');

      const worksheet = utils.json_to_sheet(output);

      const csvOutput = utils.sheet_to_csv(worksheet);

      await writeFile(
        `./pre-migration/${aggregation}-${label}.csv`,
        csvOutput,
        'utf8',
      );

      utils.book_append_sheet(
        excelWorkbook,
        worksheet,
        `${aggregation}-${label}`,
      );

      console.timeEnd(`${aggregation}-${label}`);
    }
  }

  writeXlsx(excelWorkbook, './pre-migration/pre-migration.xlsb', {
    bookType: 'xlsb',
    compression: true,
  });

  writeXlsx(excelWorkbook, './pre-migration/pre-migration.xlsx', {
    compression: true,
  });
}

// for handling pages with no all_urls and haven't been deduplicated because of it
export async function handleDuplicatePages(db: DbService) {
  console.time('handleDuplicatePages');
  const pages = (await db.collections.pages
    .find({ all_urls: { $exists: true } })
    .lean()
    .exec()) as (Page & {
    all_urls: string[];
  })[];

  const pagesDict = arrayToDictionaryFlat(pages, 'all_urls');

  const badPages = await db.collections.pages
    .find({ all_urls: null })
    .lean()
    .exec();

  const metricsWriteOps = [] as mongo.AnyBulkWriteOperation<PageMetrics>[];

  const pagesWriteOps: mongo.AnyBulkWriteOperation<Page>[] = badPages.map(
    (page) => {
      const correctPage = pagesDict[page.url];

      if (!correctPage) {
        console.log('found a page with no all_urls and no duplicate:');
        console.log(page.url);

        return {
          updateOne: {
            filter: { _id: page._id },
            update: {
              $set: {
                all_urls: [page.url],
              },
            },
          },
        };
      }

      metricsWriteOps.push({
        updateMany: {
          filter: { page: page._id },
          update: {
            $set: {
              page: correctPage._id,
            },
          },
        },
      });

      return {
        deleteOne: {
          filter: { _id: page._id },
        },
      };
    },
  );

  if (pagesWriteOps.length) {
    const pageWriteResults =
      await db.collections.pages.bulkWrite(pagesWriteOps);

    console.log(`${pageWriteResults.modifiedCount} pages modified`);
    console.log(`${pageWriteResults.deletedCount} pages deleted`);
  }

  if (metricsWriteOps.length) {
    const metricsWriteResults =
      await db.collections.pageMetrics.bulkWrite(metricsWriteOps);

    console.log(`${metricsWriteResults.modifiedCount} metrics modified`);
  }

  console.timeEnd('handleDuplicatePages');
}

export async function migratePagesToSingleUrl(db: DbService) {
  console.time('total time');
  console.time('migration');
  const dbUpdateService = (<RunScriptCommand>this).inject<DbUpdateService>(
    DbUpdateService,
  );

  await populateAllTitles.bind(<RunScriptCommand>this)(db);

  await handleDuplicatePages.bind(<RunScriptCommand>this)(db);

  const pages = (await db.collections.pages.find().lean().exec()) as (Page & {
    all_urls: string[];
  })[];

  const urls = (await db.collections.urls.find().lean().exec()) as IUrl[];
  const urlsDict = arrayToDictionary(urls, 'url');

  type UrlData = {
    title?: string;
    altLangHref?: string;
    redirect?: string;
    is_404?: boolean;
    metadata?: { [prop: string]: string | Date };
  };

  const getUrlData = (url: string): UrlData => {
    const lang = url.match(/www\.canada\.ca\/(en|fr)\//)?.[1] as 'en' | 'fr';

    const urlDoc = urlsDict[url];

    const urlData = urlDoc
      ? {
          title: urlDoc.title,
          altLangHref: urlDoc.langHrefs?.[lang === 'en' ? 'fr' : 'en'],
          redirect: urlDoc.redirect,
          is_404: urlDoc.is_404,
          metadata: urlDoc.metadata,
        }
      : {};

    return filterObject(Boolean, urlData);
  };

  // create new pages from all_urls
  const pagesFromAllUrlsWriteOps: mongo.AnyBulkWriteOperation<Page>[] = [];

  // update metrics refs for new pages
  const metricsFromNewPagesWriteOps: mongo.AnyBulkWriteOperation<PageMetrics>[] =
    [];

  // update urls page refs
  const urlsUpdateOps: mongo.AnyBulkWriteOperation<IUrl>[] = [];

  // update pages w/ urls props AND
  // unset refs + airtable_id + all_urls from pages
  const pagesUpdateOps: mongo.AnyBulkWriteOperation<Page>[] = [];

  // update readability page refs
  const readabilityUpdateOps: mongo.AnyBulkWriteOperation<Readability>[] = [];

  // update aa_item_id refs (match via url -> https:// + first 247)
  const aaItemIdUpdateOps: mongo.AnyBulkWriteOperation<AAItemId>[] = [];

  for (const page of pages) {
    // create new pages from all_urls
    if (page.all_urls?.length > 1) {
      const newPages = page.all_urls
        .filter((url) => url !== page.url)
        .map((url) => {
          const lang = url.match(/www\.canada\.ca\/(en|fr)\//)?.[1] as
            | 'en'
            | 'fr';

          const urlData = getUrlData(url);

          return {
            _id: new Types.ObjectId(),
            url,
            ...urlData,
            title: urlData.title || page.title,
            lang,
          };
        });

      for (const newPage of newPages) {
        pagesFromAllUrlsWriteOps.push({
          insertOne: {
            document: newPage,
          },
        });

        metricsFromNewPagesWriteOps.push({
          updateMany: {
            filter: { url: newPage.url, page: page._id },
            update: {
              $set: {
                page: newPage._id,
              },
              $unset: {
                tasks: '',
                projects: '',
                ux_tests: '',
              },
            },
          },
        });

        urlsUpdateOps.push({
          updateOne: {
            filter: {
              url: newPage.url,
            },
            update: {
              $set: {
                page: newPage._id,
              },
            },
          },
        });

        readabilityUpdateOps.push({
          updateMany: {
            filter: {
              url: newPage.url,
            },
            update: {
              $set: {
                page: newPage._id,
              },
            },
          },
        });

        aaItemIdUpdateOps.push({
          updateMany: {
            filter: {
              type: 'internalSearch',
              value: `https://${newPage.url.slice(0, 247)}`,
            },
            update: {
              $set: {
                page: newPage._id,
              },
            },
          },
        });
      }
    }

    // update pages w/ urls props AND
    // unset airtable_id + all_urls from pages
    const urlData = getUrlData(page.url);

    const lang = page.url.match(/www\.canada\.ca\/(en|fr)\//)?.[1] as
      | 'en'
      | 'fr';

    pagesUpdateOps.push({
      updateOne: {
        filter: { _id: page._id },
        update: {
          $set: { ...urlData, lang },
          $unset: {
            airtable_id: '',
            all_urls: '',
          },
        },
      },
    });

    // in theory itemIds and readability should already be fine,
    //  but this will be nearly instant, so might as well
    aaItemIdUpdateOps.push({
      updateMany: {
        filter: {
          type: 'internalSearch',
          value: `https://${page.url.slice(0, 247)}`,
        },
        update: {
          $set: {
            page: page._id,
          },
        },
      },
    });

    readabilityUpdateOps.push({
      updateMany: {
        filter: {
          url: page.url,
        },
        update: {
          $set: {
            page: page._id,
          },
        },
      },
    });
  }

  console.log('writing: pages from all_urls write ops');
  await outputJson('pages-from-all-urls.json', pagesFromAllUrlsWriteOps);

  console.log('writing: metrics from new pages write ops');
  await outputJson('metrics-from-new-pages.json', metricsFromNewPagesWriteOps);

  console.log('writing: urls update ops');
  await outputJson('urls-update-ops.json', urlsUpdateOps);

  console.log('writing: pages update ops');
  await outputJson('pages-update-ops.json', pagesUpdateOps);

  console.log('writing: readability update ops');
  await outputJson('readability-update-ops.json', readabilityUpdateOps);

  console.log('writing: aa_item_id update ops');
  await outputJson('aa_item_id-update-ops.json', aaItemIdUpdateOps);

  console.log(`bulk writing: pages from all_urls write ops`);
  await db.collections.pages.bulkWrite(pagesFromAllUrlsWriteOps);

  console.log(`bulk writing: urls update ops`);
  await db.collections.urls.bulkWrite(urlsUpdateOps);

  console.log(`bulk writing: pages update ops`);
  await db.collections.pages.collection.bulkWrite(
    pagesUpdateOps as mongo.AnyBulkWriteOperation[],
  );

  console.log(`bulk writing: readability update ops`);
  await db.collections.readability.bulkWrite(readabilityUpdateOps);

  console.log(`bulk writing: aa_item_id update ops`);
  await db.collections.aaItemIds.bulkWrite(aaItemIdUpdateOps);

  console.log(`bulk writing: metrics from new pages write ops`);

  const totalMetricsOps = metricsFromNewPagesWriteOps.length;

  while (metricsFromNewPagesWriteOps.length > 0) {
    const opsWritten = totalMetricsOps - metricsFromNewPagesWriteOps.length;

    console.log(`${opsWritten}/${totalMetricsOps} writes completed`);

    const batch = metricsFromNewPagesWriteOps.splice(0, 1000);

    await db.collections.pageMetrics.bulkWrite(batch);
  }

  console.log(`${totalMetricsOps}/${totalMetricsOps} writes completed`);

  console.timeEnd('migration');

  // run airtable updates
  console.log('running airtable updates');
  console.time('airtable updates');
  await dbUpdateService.updateUxData(true);
  console.timeEnd('airtable updates');

  await dbUpdateService.recalculateViews();

  console.timeEnd('total time');
}

export async function checkForDuplicatePages(db: DbService) {
  const duplicates = await db.collections.pages
    .aggregate<{ _id: string; count: number }>()
    .group({
      _id: '$url',
      count: { $sum: 1 },
    })
    .match({
      count: { $gt: 1 },
    })
    .exec();

  if (duplicates.length) {
    console.log('duplicates found');
    console.log(duplicates);
    return;
  }

  console.log('no duplicates found');
}

export async function exportRedirectsList(db: DbService) {
  const pages = await db.collections.pages
    .find({}, { _id: 0, airtable_id: 1, url: 1, redirect: 1, is_404: 1 })
    .lean()
    .exec();

  const redirectUrls = pages
    .filter((page) => page.airtable_id && page.redirect)
    .map((page) => page.redirect);

  const redirectsNotInAirtable = new Set(
    pages
      .filter((page) => redirectUrls.includes(page.url) && !page.airtable_id)
      .map(({ url }) => url),
  );

  const pagesToKeep = pages.filter(
    (page) =>
      (page.airtable_id && page.redirect) || (page.airtable_id && page.is_404),
  );

  // flag the pages that are the target of a redirect from a page with an airtable_id, that don't have an airtable_id
  const pagesToOutput = pagesToKeep.map((page) => ({
    URL: page.url,
    Redirect: page.redirect,
    'Redirect missing from airtable?': redirectsNotInAirtable.has(page.redirect)
      ? true
      : undefined,
    'Is 404?': page.is_404 ? true : undefined,
    'Airtable link': `https://airtable.com/appT2OrwxPXlBmKgQ/tblNeB2Fl3XUXQ9Cf/viwP1wGGBDgzAEvxB/${page.airtable_id}`,
  }));

  const redirectsToOutput = pagesToOutput
    .filter((page) => page.Redirect)
    .map((page) => omit(['Is 404?'], page));

  const is404sToOutput = pagesToOutput
    .filter((page) => !page.URL.endsWith('.pdf') && page['Is 404?'])
    .map((page) => omit(['Redirect', 'Redirect missing from airtable?'], page));

  const sheets = [
    {
      sheetName: 'Redirects',
      data: redirectsToOutput,
    },
    {
      sheetName: '404s',
      data: is404sToOutput,
    },
  ];

  await outputExcel('airtable_redirects_404s.xlsx', sheets);
}

export async function reformatAllTitlesJson() {
  const originalJson = JSON.parse(
    await readFile('all_titles_v2.json', 'utf-8'),
  ) as { url: string; title: string }[];

  const newJson = {} as Record<string, string[]>;

  for (const { url, title } of originalJson) {
    if (!newJson[url]) {
      newJson[url] = [];
    }

    newJson[url].push(title);
  }

  await writeFile(
    'all_titles_v2_reformatted.json',
    JSON.stringify(newJson),
    'utf-8',
  );
}

export async function uploadAllTitlesJson() {
  const blobService = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name,
  );
  const allTitles = await readFile('all_titles_v2_reformatted.json', 'utf-8');
  const allTitlesDeletion = await readFile(
    'all_titles_deletion_reformatted.json',
    'utf-8',
  );

  await blobService.blobModels.urls
    .blob('all-titles.json')
    .uploadFromString(allTitles, { overwrite: true });
  await blobService.blobModels.urls
    .blob('all-titles_deletion.json')
    .uploadFromString(allTitlesDeletion);
}

export async function fixActivityMapTitles(db: DbService) {
  const blobService = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name,
  );

  const titlesToRemove: Record<string, string[]> =
    await blobService.blobModels.urls
      .blob('all-titles_deletion.json')
      .downloadToString()
      .then(JSON.parse);

  console.log('Removing bad titles');
  for (const [url, titles] of Object.entries(titlesToRemove)) {
    await db.collections.urls.updateOne(
      { url },
      {
        $pullAll: {
          all_titles: titles,
        },
      },
    );
  }

  // make sure current title is in all_titles
  console.log('Ensuring (url) titles are in all_titles');

  const urls = await db.collections.urls
    .find({ title: { $exists: true } })
    .lean()
    .exec();

  // cool variable name right?
  const ensureTitlesInAllTitlesBulkWriteOps: mongo.AnyBulkWriteOperation<IUrl>[] =
    urls.map(({ _id, title }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $addToSet: {
            all_titles: title,
          },
        },
      },
    }));

  await db.collections.urls.bulkWrite(ensureTitlesInAllTitlesBulkWriteOps, {
    ordered: false,
  });

  console.log('Deleting activityMap itemIds');
  await db.collections.aaItemIds
    .deleteMany({ type: 'activityMapTitle' })
    .lean()
    .exec();

  console.log('unsetting activity_map from metrics');
  console.time('unsetting metrics');
  await db.collections.pageMetrics.updateMany(
    {
      activity_map: { $exists: true },
    },
    {
      $unset: {
        activity_map: '',
      },
    },
  );
  console.timeEnd('unsetting metrics');

  console.log('Done fixing bad titles. Activity map needs to be repopulated.');
}

// Finds and removes "hashes" that are essentially the same content
// from the urls collection, readability, and blob storage
export async function removeRedundantUrlHashes(db: DbService) {
  const blob = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name,
  );

  const blobContainer = blob.blobModels.urls;

  // delete duplicate readability scores (same url/hash/score/word count)
  const duplicateReadability = await db.collections.readability
    .aggregate([
      {
        $project: {
          date: 1,
          url: 1,
          hash: 1,
          total_words: 1,
          final_fk_score: 1,
        },
      },
      {
        $group: {
          _id: { url: '$url', hash: '$hash' },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .exec();

  if (duplicateReadability.length) {
    console.log(
      `Found ${duplicateReadability.length} duplicate readability scores, deleting duplicates...`,
    );

    const compareReadabilityDocs = (a: IReadability, b: IReadability) =>
      a.url === b.url &&
      a.hash === b.hash &&
      a.final_fk_score === b.final_fk_score &&
      a.total_words === b.total_words;

    for (const { docs } of duplicateReadability) {
      const sorted = docs.sort((a, b) => a.date.getTime() - b.date.getTime());

      const allAreSame = sorted.every((doc, i) =>
        compareReadabilityDocs(doc, sorted[i + 1] || doc),
      );

      if (!allAreSame) {
        throw Error(
          `Not all docs are the same for: \n${sorted[0].url} \n ${sorted[0].hash}\n cannot proceed`,
        );
      }

      const [keep, ...rest] = sorted;

      for (const doc of rest) {
        await db.collections.readability.deleteOne({ _id: doc._id });
      }
    }

    console.log('Successfully removed duplicate readability scores');
  }

  const readability = await db.collections.readability
    .find({}, { date: 1, url: 1, hash: 1, final_fk_score: 1, total_words: 1 })
    .lean()
    .exec();

  const readabilityScoresByUrl = arrayToDictionaryMultiref(readability, 'url');

  const startingReadabilityCount =
    await db.collections.readability.estimatedDocumentCount();

  console.log(
    'Estimated starting count of readability scores:',
    startingReadabilityCount,
  );

  // to keep track of and dump state if something goes wrong
  const pendingOps = {
    urlHashesToRemove: [] as string[],
    readabilityHashesToDelete: [] as string[],
    blobHashesToDelete: [] as string[],

    async dump() {
      const dumpFile = `pendingOps_${new Date().getTime()}.json`;

      console.error('Dumping pending operations to:', dumpFile);

      await writeFile(
        dumpFile,
        prettyJson({
          urlHashesToRemove: this.urlHashesToRemove,
          readabilityHashesToDelete: this.readabilityHashesToDelete,
          blobHashesToDelete: this.blobHashesToDelete,
        }),
      );
    },

    addPending(hashes: Set<string>) {
      for (const hash of hashes) {
        this.urlHashesToRemove.push(hash);
        this.readabilityHashesToDelete.push(hash);
        this.blobHashesToDelete.push(hash);
      }
    },

    setUrlsProcessed(hash: string) {
      // in case it's not done in order for whatever reason
      if (this.urlHashesToRemove[0] === hash) {
        this.urlHashesToRemove.shift();
        return;
      }
      this.urlHashesToRemove = this.urlHashesToRemove.filter((h) => h !== hash);
    },

    setReadabilityProcessed(hash: string) {
      if (this.readabilityHashesToDelete[0] === hash) {
        this.readabilityHashesToDelete.shift();
        return;
      }
      this.readabilityHashesToDelete = this.readabilityHashesToDelete.filter(
        (h) => h !== hash,
      );
    },

    setBlobProcessed(hash: string) {
      if (this.blobHashesToDelete[0] === hash) {
        this.blobHashesToDelete.shift();
        return;
      }
      this.blobHashesToDelete = this.blobHashesToDelete.filter(
        (h) => h !== hash,
      );
    },
  };

  const redundantHashes: Set<string> = new Set();
  const hashesToKeep: Set<string> = new Set();
  const shouldSkip = (hash: string) =>
    redundantHashes.has(hash) || hashesToKeep.has(hash);

  const urlDocs = await db.collections.urls
    .aggregate<IUrl & { hashesCount: number }>([
      {
        $project: {
          url: 1,
          hashes: 1,
          hashesCount: { $size: '$hashes' },
        },
      },
      {
        $match: { hashesCount: { $gt: 6 } },
      },
      { $sort: { hashesCount: -1 } },
    ])
    .exec();

  console.log(`${urlDocs.length} urls with more than 6 hashes`);

  // if final score and word count are the same, treat hash as redundant
  const isSame = (a: IReadability, b: IReadability) =>
    a.final_fk_score === b.final_fk_score && a.total_words === b.total_words;

  const progress = new TimingUtility(urlDocs.length);

  console.log('Finding redundant hashes...');

  for (const urlDoc of urlDocs) {
    const urlHashes = urlDoc.hashes.filter(({ hash }) => !shouldSkip(hash));

    if (urlHashes.length <= 2) {
      continue;
    }

    const readabilityScores = readabilityScoresByUrl[urlDoc.url]
      ?.filter(({ hash }) => !shouldSkip(hash))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!readabilityScores || readabilityScores.length <= 2) {
      continue;
    }

    let runStart: IReadability | null = null;
    let prev: IReadability | null = null;

    for (const score of readabilityScores) {
      if (!runStart || !isSame(runStart, score)) {
        hashesToKeep.add(score.hash);
        runStart = score;
        prev = null;

        continue;
      }

      if (!prev) {
        prev = score;
        continue;
      }

      redundantHashes.add(prev.hash);

      prev = score;
    }

    progress.logIteration(`${redundantHashes.size} redundant hashes found |`);
  }

  console.log(`Found ${redundantHashes.size} redundant hashes`);

  pendingOps.addPending(redundantHashes);

  const removalProgress = new TimingUtility(redundantHashes.size);

  console.log(
    'Removing redundant hashes from urls, readability, and blob storage...',
  );

  try {
    for (const hash of redundantHashes) {
      await Promise.all([
        // urls
        db.collections.urls
          .updateMany({ 'hashes.hash': hash }, { $pull: { hashes: { hash } } })
          .then(() => pendingOps.setUrlsProcessed(hash)),

        // readability
        db.collections.readability
          .deleteMany({
            hash,
          })
          .then(() => pendingOps.setReadabilityProcessed(hash)),

        // blobs
        blobContainer
          .blob(hash)
          .delete()
          .then(() => pendingOps.setBlobProcessed(hash)),
      ]);

      removalProgress.logIteration(`Processed: ${hash} |`);
    }
  } catch (e) {
    console.error(
      chalk.redBright('Error occurred processing redundant hashes:'),
      chalk.red(e.stack),
    );
    await pendingOps.dump();
  }

  const newReadabilityCount =
    await db.collections.readability.estimatedDocumentCount();

  console.log(
    `Readability count before: ${startingReadabilityCount} | after: ${newReadabilityCount}`,
  );
}

export async function generateTaskTranslations(db: DbService) {
  const taskTitles = await db.collections.tasks
    .find({}, { title: 1, title_fr: 1 })
    .lean()
    .exec();

  const translations_en = Object.fromEntries(
    taskTitles.map(({ title }) => [title, title]),
  );

  const translations_fr = Object.fromEntries(
    taskTitles.map(({ title, title_fr }) => [title, title_fr || title]),
  );

  const missingTranslations = Object.entries(translations_fr)
    .filter(([key, value]) => key === value)
    .map(([key]) => key);

  const outPath = 'libs/upd/i18n/src/lib/translations/';

  const enOutPath = `${outPath}tasks_en-CA.json`;
  const frOutPath = `${outPath}tasks_fr-CA.json`;

  console.log(`Writing English translations to: ${enOutPath}`);
  await writeFile(enOutPath, prettyJson(translations_en));

  console.log(`Writing French translations to: ${frOutPath}`);
  await writeFile(frOutPath, prettyJson(translations_fr));

  console.log('Missing translations:');
  console.log(missingTranslations);
}

export async function importGcTss() {
  const db = (<RunScriptCommand>this).inject<DbService>(DbService);

  const data = JSON.parse(
    await readFile('gc-tasks-tss_2024-04-29_2024-05-05.json', 'utf-8'),
  ).map((task) => ({
    ...task,
    _id: new Types.ObjectId(),
  }));

  let added = 0;

  while (data.length) {
    const batch = data.splice(0, 20000);

    const results = await db.collections.gcTasks.insertMany(batch);

    added += results.length;

    console.log(`Added ${results.length} records to gcTasks`);
  }

  console.log(`Added total of ${added} records to gcTasks`);
}

export async function populateFeedbackWords(db: DbService) {
  console.time('Fetching feedback from db');
  const feedback = await db.collections.feedback
    .find(
      {},
      {
        lang: 1,
        comment: 1,
        words: {
          $cond: [
            { $ne: [{ $type: '$words' }, 'missing'] },
            { $size: '$words' },
            undefined,
          ],
        },
      },
    )
    .lean()
    .exec();
  console.timeEnd('Fetching feedback from db');

  const idsWithWords = feedback
    .filter((feedback) => feedback.words?.length)
    .map(({ _id }) => _id);

  console.log('Preprocessing feedback words');
  console.time('Preprocessing feedback words');
  const feedbackWithWords = preprocessCommentWords(feedback).filter(
    (feedback) => feedback.words?.length,
  );
  console.timeEnd('Preprocessing feedback words');

  const newIdsWithWords = feedbackWithWords.map(({ _id }) => _id);

  const idsNoLongerHavingWords = difference(idsWithWords, newIdsWithWords);

  const wordRemoveOps: mongo.AnyBulkWriteOperation<IFeedback>[] =
    idsNoLongerHavingWords.map((_id) => ({
      updateOne: {
        filter: { _id },
        update: {
          $unset: {
            words: '',
          },
        },
      },
    }));

  const updateOps: mongo.AnyBulkWriteOperation<IFeedback>[] =
    feedbackWithWords.map(({ _id, words }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            words,
          },
        },
      },
    }));

  console.log(
    `Removing words from ${idsNoLongerHavingWords.length} comments...`,
  );

  await db.collections.feedback.bulkWrite(wordRemoveOps, { ordered: false });

  console.log('Adding preprocessed words to feedback...');

  console.time('Updating feedback');
  await db.collections.feedback.bulkWrite(updateOps, { ordered: false });
  console.timeEnd('Updating feedback');

  console.log('Successfully added words to feedback');
}

export async function populateFeedbackReferences(db: DbService) {
  console.time('Fetching pages');
  const pages: IPage[] = await db.collections.pages
    .find({}, { url: 1, tasks: 1, projects: 1 })
    .lean()
    .exec();
  console.timeEnd('Fetching pages');

  console.time('Syncing feedback references');
  await db.collections.feedback.syncReferences(pages);
  console.timeEnd('Syncing feedback references');

  console.log('Successfully synced feedback references.');
}

export async function updatePageSections() {
  const db = (<RunScriptCommand>this).inject<DbService>(DbService);
  const airtableClient = new AirtableClient();

  console.log('Getting pages from the database and Airtable...');

  const pages = await db.collections.pagesList.find({}).exec();
  const airtableList = await airtableClient.getPagesList();

  console.log(`Got ${pages.length} pages from the database`);
  console.log(`Got ${airtableList.length} pages from Airtable`);

  const atDict = arrayToDictionary(airtableList, 'url');

  const pagesWriteOps: mongo.AnyBulkWriteOperation<PagesList>[]  = pages
    .map((page) => {
      if (atDict[page.url] && atDict[page.url].sections !== page.sections || atDict[page.url].owners !== page.owners) {
        return {
          updateOne: {
            filter: { url: page.url },
            update: {
              $set: { sections: atDict[page.url].sections, owners: atDict[page.url].owners },
            },
          },
        };
      }
    })
    .filter((page) => page);

  if (pagesWriteOps.length > 0) {
    const pageWriteResults =
      await db.collections.pagesList.bulkWrite(pagesWriteOps);
    console.log(`${pageWriteResults.modifiedCount} page(s) modified`);
  } else {
    console.log('No updates needed.');
  }
}
