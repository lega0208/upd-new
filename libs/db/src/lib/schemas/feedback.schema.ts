import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ collection: 'feedback' })
export class Feedback {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true })
  airtable_id: string;

  @Prop({ type: String, required: true, index: true })
  url: string;

  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ type: [String] })
  tags?: string[] = [];

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

export const feedbackModel = model(Feedback.name, FeedbackSchema);

export function getFeedbackModel(): Model<Document<Feedback>> {
  return feedbackModel;
}
