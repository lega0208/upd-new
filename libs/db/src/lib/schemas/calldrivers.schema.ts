import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Page } from './page.schema';
import { UxTest } from './ux-test.schema';
import { Task } from './task.schema';

export type CallDriverDocument = CallDriver & Document;

@Schema()
export class CallDriver {
  @Prop({ required: true, unique: true })
  _id: Types.ObjectId = new Types.ObjectId('');

}

export const CallDriverSchema = SchemaFactory.createForClass(CallDriver);
