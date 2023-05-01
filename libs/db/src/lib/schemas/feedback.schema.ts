import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { FeedbackComment, IFeedback } from '@dua-upd/types-common';

export type FeedbackDocument = Feedback & Document;

@Schema({ collection: 'feedback' })
export class Feedback implements IFeedback {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String })
  airtable_id? = '';

  @Prop({ type: String, required: true, index: true })
  url = '';

  @Prop({ type: Date, required: true, index: true })
  date: Date = new Date(0);

  @Prop({ type: String })
  lang = '';

  @Prop({ type: String })
  comment = '';

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
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

FeedbackSchema.index({ url: 1, date: 1 });

FeedbackSchema.statics['getCommentsByTag'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  urls: string[]
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
        $ifNull: [ '$_id', 'n/a' ]
      },
      numComments: 1,
    })
    .exec();
};

FeedbackSchema.statics['getComments'] = async function (
  this: Model<Feedback>,
  dateRange: string,
  urls: string[]
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

export interface FeedbackModel extends Model<Feedback> {
  getComments: (
    dateRange: string,
    urls: string[]
  ) => Promise<FeedbackComment[]>;
  getCommentsByTag: (
    dateRange: string,
    urls: string[]
  ) => Promise<{ tag: string; numComments: number }[]>;
}
