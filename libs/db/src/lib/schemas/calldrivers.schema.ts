import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver {
  @Prop({ required: true, unique: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true })
  airtable_id: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  enquiry_line: string;

  @Prop({ type: String })
  topic?: string;

  @Prop({ type: String })
  subtopic?: string;

  @Prop({ type: String })
  sub_subtopic?: string;

  @Prop({ type: Number, required: true })
  tpc_id: number;

  @Prop({ type: Number, required: true })
  impact: number;

  @Prop({ type: Number, required: true })
  calls: number;
}

export const CallDriverSchema = SchemaFactory.createForClass(CallDriver);

export function getCallDriversModel(): Model<Document<CallDriver>> {
  return model(CallDriver.name, CallDriverSchema);
}
