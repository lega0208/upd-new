import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FilterQuery, Model, Types, mongo } from 'mongoose';
import type { FeedbackComment, IFeedback, IPage } from '@dua-upd/types-common';
import {
  arrayToDictionary,
  dateRangeSplit,
  percentChange,
} from '@dua-upd/utils-common';

export type FeedbackDocument = Feedback & Document;

@Schema({ collection: 'feedback' })
export class Feedback implements IFeedback {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String })
  airtable_id? = '';

  @Prop({ type: Types.ObjectId, index: true })
  unique_id?: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  url = '';

  @Prop({ type: Date, required: true, index: true })
  date: Date = new Date(0);

  @Prop({ type: String })
  lang = '';

  @Prop({ type: String })
  comment = '';

  @Prop({ type: [String], default: undefined })
  words?: string[];

  @Prop({ type: [String], default: undefined })
  tags?: string[];

  @Prop({ type: String })
  status?: string;

  @Prop({ type: String })
  whats_wrong?: string;

  @Prop({ type: String })
  main_section?: string;

  @Prop({ type: String })
  theme?: string;

  @Prop({ type: Types.ObjectId, index: true })
  page?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], index: true, default: undefined })
  tasks?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], index: true, default: undefined })
  projects?: Types.ObjectId[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

FeedbackSchema.index({ url: 1, date: 1 });
FeedbackSchema.index(
  { date: 1, words: 1 },
  { partialFilterExpression: { words: { $exists: true } } },
);
FeedbackSchema.index(
  { date: 1, page: 1 },
  { partialFilterExpression: { page: { $exists: true } } },
);
FeedbackSchema.index(
  { date: 1, tasks: 1 },
  { partialFilterExpression: { tasks: { $exists: true } } },
);
FeedbackSchema.index(
  { date: 1, projects: 1 },
  { partialFilterExpression: { projects: { $exists: true } } },
);

FeedbackSchema.statics['syncReferences'] = async function (
  this: Model<Feedback>,
  pages: Pick<IPage, '_id' | 'url' | 'tasks' | 'projects'>[],
) {
  const bulkWriteOps: mongo.AnyBulkWriteOperation<IFeedback>[] = pages.map(
    (page) => ({
      updateMany: {
        filter: { url: page.url },
        update: {
          $set: {
            page: page._id,
            tasks: page.tasks,
            projects: page.projects,
          },
        },
      },
    }),
  );

  await this.bulkWrite(bulkWriteOps, { ordered: false });
};

FeedbackSchema.statics['getCommentsByTag'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  urls: string[],
) {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate<{ tag: string; numComments: number }>()
    .match({
      url: { $in: urls },
      date: { $gte: startDate, $lte: endDate },
    })
    .unwind({ path: '$tags', preserveNullAndEmptyArrays: true })
    .group({
      _id: '$tags',
      numComments: { $sum: 1 },
    })
    .project({
      _id: 0,
      tag: {
        $ifNull: ['$_id', 'n/a'],
      },
      numComments: 1,
    })
    .exec();
};

FeedbackSchema.statics['getComments'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  urls: string[],
) {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return (
    (await this.find({
      url: { $in: urls },
      date: { $gte: startDate, $lte: endDate },
    }).exec()) || []
  ).map((feedback: Feedback) => ({
    date: feedback.date,
    url: feedback.url,
    tag: feedback.tags?.length ? feedback.tags[0] : '',
    whats_wrong: feedback.whats_wrong || '',
    comment: feedback.comment,
  }));
};

FeedbackSchema.statics['getCommentsByDay'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  urls: string[],
) {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate<{ date: string; sum: number }>()
    .project({
      date: 1,
      url: 1,
    })
    .match({
      url: { $in: urls },
      date: { $gte: startDate, $lte: endDate },
    })
    .group({
      _id: '$date',
      sum: { $sum: 1 },
    })
    .project({
      _id: 0,
      date: '$_id',
      sum: 1,
    })
    .sort({ date: 1 })
    .exec();
};

FeedbackSchema.statics['getCommentsByPage'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  idFilter?: { tasks: Types.ObjectId } | { projects: Types.ObjectId },
) {
  const [startDate, endDate] = dateRangeSplit(dateRange);

  const projection = idFilter
    ? Object.fromEntries(Object.keys(idFilter).map((key) => [key, 1]))
    : {};

  const matchFilter: FilterQuery<Feedback> = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    ...(idFilter || {}),
  };

  // @@@@@ doesn't include 0 comments-- fix to merge into page list
  return this.aggregate<{
    _id: string;
    title: string;
    url: string;
    sum: number;
  }>()
    .project({
      date: 1,
      url: 1,
      ...projection,
    })
    .match(matchFilter)
    .group({
      _id: '$url',
      sum: { $sum: 1 },
    })
    .addFields({
      url: '$_id',
    })
    .sort({ sum: -1 })
    .lookup({
      from: 'pages',
      localField: 'url',
      foreignField: 'url',
      as: 'page',
    })
    .match({
      page: { $ne: [] },
    })
    .unwind('$page')
    .addFields({
      _id: '$page._id',
      title: '$page.title',
      owners: '$page.owners',
      section: '$page.sections',
    })
    .project({
      page: 0,
    })
    .exec();
};

FeedbackSchema.statics['getCommentsByPageWithComparison'] = async function (
  this: FeedbackModel,
  dateRange: string,
  comparisonDateRange: string,
  idFilter?: { [type in 'tasks' | 'projects']: Types.ObjectId },
) {
  const [commentsByPage, comparisonCommentsByPage] = await Promise.all([
    this.getCommentsByPage(dateRange, idFilter),
    this.getCommentsByPage(comparisonDateRange, idFilter),
  ]);

  const comparisonCommentsDict = arrayToDictionary(
    comparisonCommentsByPage,
    'url',
  );

  return commentsByPage.map((page) => {
    const numPreviousComments = comparisonCommentsDict[page.url]?.sum;

    return {
      ...page,
      percentChange: numPreviousComments
        ? percentChange(page.sum, numPreviousComments)
        : null,
    };
  });
};

export interface FeedbackModel extends Model<Feedback> {
  syncReferences: (
    pages: Pick<IPage, '_id' | 'url' | 'tasks' | 'projects'>[],
  ) => Promise<void>;
  getComments: (
    dateRange: string,
    urls: string[],
  ) => Promise<FeedbackComment[]>;
  getCommentsByTag: (
    dateRange: string,
    urls: string[],
  ) => Promise<{ tag: string; numComments: number }[]>;
  getCommentsByPage: (
    dateRange: string,
    idFilter?: { tasks: Types.ObjectId } | { projects: Types.ObjectId },
  ) => Promise<
    {
      _id: string;
      title: string;
      url: string;
      sum: number;
    }[]
  >;
  getCommentsByPageWithComparison: (
    dateRange: string,
    comparisonDateRange: string,
    idFilter?: { tasks: Types.ObjectId } | { projects: Types.ObjectId },
  ) => Promise<
    {
      _id: string;
      title: string;
      url: string;
      sum: number;
      percentChange: number | null;
    }[]
  >;
  getCommentsByDay: (
    dateRange: string,
    urls: string[],
  ) => Promise<{ date: string; sum: number }[]>;
}
