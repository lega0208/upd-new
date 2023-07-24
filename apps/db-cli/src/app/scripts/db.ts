import { DbService, Page } from '@dua-upd/db';
import { DbUpdateService, processHtml, UrlsService } from '@dua-upd/db-update';
import { singleDatesFromDateRange } from '@dua-upd/external-data';
import { arrayToDictionary, dayjs } from '@dua-upd/utils-common';
import { readFile, writeFile } from 'fs/promises';
import { AnyBulkWriteOperation } from 'mongodb';
import { Types } from 'mongoose';
import { IFeedback, IUrl } from '@dua-upd/types-common';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { RunScriptCommand } from '../run-script.command';
import { startTimer } from './utils/misc';

export const recalculateViews = async (
  db: DbService,
  updateService: DbUpdateService
) => {
  return await updateService.recalculateViews();
};

export const addMissingPageMetricsRefs = async (db: DbService) => {
  await db.addMissingAirtableRefsToPageMetrics();
};

export async function uploadFeedback(_, __, ___, blob: BlobStorageService) {
  const time = startTimer('uploadFeedback');
  const feedback = await readFile(
    'feedback_cleanest_2021-04-01_2023-04-16.json',
    'utf-8'
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
  blob: BlobStorageService
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
  blob: BlobStorageService
) {
  const filename = 'feedback_2021-04-01_2023-04-16.json';

  const feedback = <Omit<IFeedback, '_id'>[]>JSON.parse(
    await blob.blobModels.feedback.blob(filename).downloadToString({
      blockSize: 1_048_576,
      concurrency: 6,
    })
  ).map(
    (feedback) =>
      ({
        _id: new Types.ObjectId(),
        ...feedback,
      } as IFeedback)
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
    'utf-8'
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
  blob: BlobStorageService
) {
  const filename = 'feedback_2023-04-17_2023-06-25.json';

  const feedback = <Omit<IFeedback, '_id'>[]>JSON.parse(
    await blob.blobModels.feedback.blob(filename).downloadToString()
  ).map(
    (feedback) =>
      ({
        _id: new Types.ObjectId(),
        ...feedback,
      } as IFeedback)
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

  const writeOps: AnyBulkWriteOperation<IUrl>[] = urls.map((url) => ({
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

  const writeOps: AnyBulkWriteOperation<IUrl>[] = urls.map((url) => ({
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

export async function repopulateGscSearchTerms() {
  const dbUpdateService = (<RunScriptCommand>this).inject<DbUpdateService>(
    DbUpdateService
  );

  console.time('repopulateGscSearchTerms');

  const sixteenMonthsAgo = dayjs().subtract(16, 'months').format('YYYY-MM-DD');

  console.log('16 months ago: ', sixteenMonthsAgo);

  await dbUpdateService.upsertOverallGscMetrics(
    singleDatesFromDateRange(
      {
        start: sixteenMonthsAgo,
        end: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      },
      false,
      true
    ) as Date[]
  );

  console.timeEnd('repopulateGscSearchTerms');
}

// repopulate titles from blobs because of bug causing mangled titles
export async function repairUrlTitles(db: DbService) {
  console.time('repairUrlTitles');
  const blobService = (<RunScriptCommand>this).inject<BlobStorageService>(
    BlobStorageService.name
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
      (urlWithBlob): AnyBulkWriteOperation<IUrl> => {
        const htmlData = processHtml(urlWithBlob.blobContent);

        if (!htmlData) {
          return;
        }

        const blobTitle = htmlData.title;

        const newAllTitles = [
          ...new Set(
            [blobTitle, urlWithBlob.title, ...urlWithBlob.all_titles].map(
              (title) => title.trim().replace(/\s+/g, ' ')
            )
          ),
        ];

        const couldBeMangled = newAllTitles.filter((title) =>
          title.includes('ss')
        );

        const cleanAllTitles = newAllTitles.filter(
          (title) =>
            !couldBeMangled.some((comparison) => isMangled(comparison, title))
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
      }
    )
  ).filter(Boolean) as AnyBulkWriteOperation<IUrl>[];

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

  const pageTitleChanges: AnyBulkWriteOperation<Page>[] = pagesTitles
    .filter(
      ({ _id, title }) => currentPageTitlesDict[_id.toString()].title !== title
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
