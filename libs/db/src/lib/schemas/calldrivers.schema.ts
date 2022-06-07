import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type { CallsByTopic } from './types';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true })
  airtable_id = '';

  @Prop({ type: Date, required: true, index: true })
  date = new Date(0);

  @Prop({ type: String, required: true, index: true })
  enquiry_line = '';

  @Prop({ type: String })
  topic?: string;

  @Prop({ type: String })
  subtopic?: string;

  @Prop({ type: String })
  sub_subtopic?: string;

  @Prop({ type: Number })
  tpc_id = 999999; // Some records don't have a tpc_id, so they will default to this value

  @Prop({ type: Number })
  impact = 0;

  @Prop({ type: Number })
  calls = 0;
}

export const CallDriverSchema = SchemaFactory.createForClass(CallDriver);

export function getCallDriversModel(): Model<Document<CallDriver>> {
  return model(CallDriver.name, CallDriverSchema);
}

CallDriverSchema.statics['getCallsByTopicFromIds'] = async function (
  documentIds: Types.ObjectId[]
) {
  return this.aggregate<CallsByTopic>()
    .match({
      _id: { $in: documentIds },
    })
    .project({
      _id: 0,
      tpc_id: 1,
      topic: 1,
      subtopic: 1,
      sub_subtopic: 1,
      calls: 1,
    })
    .group({
      _id: '$tpc_id',
      topic: { $first: '$topic' },
      subtopic: { $first: '$subtopic' },
      sub_subtopic: { $first: '$sub_subtopic' },
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      tpc_id: '$_id',
      topic: 1,
      subtopic: 1,
      sub_subtopic: 1,
      calls: 1,
    })
    .exec();
};

CallDriverSchema.statics['getCallsByEnquiryLineFromIds'] = async function (
  documentIds: Types.ObjectId[]
) {
  return this.aggregate<{ enquiry_line: string; calls: number }>()
    .match({
      _id: { $in: documentIds },
    })
    .project({
      _id: 0,
      enquiry_line: 1,
      calls: 1,
    })
    .group({
      _id: '$enquiry_line',
      calls: { $sum: '$calls' },
    })
    .project({
      _id: 0,
      calls: 1,
      enquiry_line: '$_id',
    })
    .sort({ enquiry_line: 'asc' })
    .exec();
};

export interface CallDriverModel extends Model<CallDriverDocument> {
  getCallsByTopicFromIds(
    documentIds: Types.ObjectId[]
  ): Promise<CallsByTopic[]>;
  getCallsByEnquiryLineFromIds(
    documentIds: Types.ObjectId[]
  ): Promise<{ enquiry_line: string; calls: number }[]>;
}
