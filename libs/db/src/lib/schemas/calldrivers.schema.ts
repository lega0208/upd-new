import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { registerDiscriminator } from './collection.schema';

export type CallDriverDocument = CallDriver & Document;

@Schema({ autoIndex: false })
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

  @Prop({ type: Number, index: true })
  tpc_id = 999999; // Some records don't have a tpc_id, so they will default to this value

  @Prop({ type: Number })
  impact = 0;

  @Prop({ type: Number })
  calls = 0;
}

export const CallDriverSchema = SchemaFactory.createForClass(CallDriver);

export const CalldriversConfig = {
  name: CallDriver.name,
  schema: CallDriverSchema,
}

export function getCallDriversModel() {
  return registerDiscriminator(CalldriversConfig)
}

