import { DbService } from '@dua-upd/db';
import { DbUpdateService } from '@dua-upd/db-update';
import { readFile, writeFile } from 'fs/promises';
import { Types } from 'mongoose';
import { IFeedback } from '@dua-upd/types-common';

export const recalculateViews = async (db: DbService, updateService: DbUpdateService) => {
  return await updateService.recalculateViews();
}

export const addMissingPageMetricsRefs = async (db: DbService) => {
  await db.addMissingAirtableRefsToPageMetrics();
}

export async function addFeedbackFromCsv(db: DbService) {
  type CsvFeedback = {
    Date: Date;
    'Time stamp': string;
    Comment?: string;
    Problem?: string;
    URL: string;
    Language: string;
    Section: string;
    Theme: string;
    Department: string;
  };

  const dbFeedback = await db.collections.feedback
    .find({
      url: RegExp(
        '\\/en\\/revenue-agency|\\/fr\\/agence-revenu|\\/en\\/services\\/taxes|\\/fr\\/services\\/impots',
        'i'
      ),
    })
    .sort('date')
    .exec();

  const feedback: CsvFeedback[] = JSON.parse(
    await readFile('feedback_filtered.json', 'utf-8'),
    (key, value) => (key === 'Date' ? new Date(value) : value)
  );

  const dates = [
    ...new Set<number>(
      feedback.map((f) => f.Date.getTime()).sort((a, b) => a - b)
    ),
  ]
    .filter((t) => t !== new Date('2023-04-11').getTime())
    .map((t) => new Date(t));

  let newEntriesLog = '';

  let totalExistingComments = 0;
  let totalNewComments = 0;

  for (const date of dates) {
    let existingComments = 0;
    let newComments = 0;

    const dbComments = dbFeedback
      .filter((f) => f.date.getTime() === date.getTime())
      .map((f) => {
        f.comment = f.comment?.trim();

        return f;
      });
    const comments = feedback.filter(
      (f) => f.Date.getTime() === date.getTime()
    );

    for (const comment of comments) {
      const dbComment = dbComments.find(
        (c) => c.comment === comment.Comment && c.url === comment.URL
      );

      if (dbComment) {
        existingComments++;
        continue;
      }

      await db.collections.feedback.insertMany({
        _id: new Types.ObjectId(),
        url: comment.URL,
        date: comment.Date,
        comment: comment.Comment,
        problem: comment.Problem,
        lang: comment.Language.toUpperCase(),
      } as IFeedback);

      newComments++;

      const entriesLog = `[${comment.Date.toISOString().slice(0, 10)}] - ${
        comment.URL
      } - ${comment.Comment}\r\n`;

      newEntriesLog += entriesLog;
    }

    console.log(
      `[${date
        .toISOString()
        .slice(
          0,
          10
        )}] - ${existingComments} existing comments, ${newComments} new comments`
    );

    totalExistingComments += existingComments;
    totalNewComments += newComments;
  }
  console.log(
    `\r\n${totalExistingComments} existing comments found\r\n${totalNewComments} new comments added\r\n`
  );

  await writeFile(
    `new_feedback_entries-${new Date().toISOString()}.txt`,
    newEntriesLog,
    'utf-8'
  );
}
