import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { registerDiscriminator } from './collection.schema';

export type FeedbackDocument = Feedback & Document;

@Schema({ autoIndex: false })
export class Feedback {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true })
  airtable_id = '';

  @Prop({ type: String, required: true, index: true })
  url = '';

  @Prop({ type: Date, required: true, index: true })
  date: Date = new Date(0);

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

export const FeedbackConfig = {
  name: Feedback.name,
  schema: FeedbackSchema,
}

export function getFeedbackModel() {
  return registerDiscriminator(FeedbackConfig);
}

