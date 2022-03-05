import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true })
  airtable_id = '';

  @Prop({ type: Date, required: true })
  date = new Date(0);

  @Prop({ type: String, required: true })
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
