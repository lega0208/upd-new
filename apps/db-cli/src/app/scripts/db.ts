import { DbService } from '@dua-upd/db';
import { DbUpdateService, UrlsService } from '@dua-upd/db-update';
import { readFile, writeFile } from 'fs/promises';
import { Types } from 'mongoose';
import { IFeedback } from '@dua-upd/types-common';
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
