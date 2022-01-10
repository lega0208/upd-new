import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PageDocument = Page & Document;

@Schema()
export class Page {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId('');

  @Prop({ required: true, type: String })
  url = '';

  @Prop({ required: true, type: String })
  title = '';

  @Prop({ type: String })
  airtableId = '';

  @Prop({ type: String })
  language = '';
}

export const PageSchema = SchemaFactory.createForClass(Page);
