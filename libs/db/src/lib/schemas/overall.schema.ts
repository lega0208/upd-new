import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OverallDocument = Overall & Document;

@Schema({ collection: 'overall_metrics' })
export class Overall {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId('');

  @Prop({ required: true, type: Date })
  date = new Date(0);

  @Prop({ type: Number })
  dyf_submit = 0;

  @Prop({ type: Number })
  dyf_yes = 0;

  @Prop({ type: Number })
  dyf_no = 0;

  @Prop({ type: Number })
  views = 0;

  @Prop({ type: Number })
  visits = 0;

  @Prop({ type: Number })
  average_time_spent = 0;
}

export const OverallSchema = SchemaFactory.createForClass(Overall);
