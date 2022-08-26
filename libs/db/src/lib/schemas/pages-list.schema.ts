import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Types } from 'mongoose';

export interface PagesListItem {
  url: string;
  title: string;
  lang: 'en' | 'fr' | '';
  last_255: string;
}

export type PagesListDocument = PagesList & Document;

@Schema({ collection: 'pages_list', timestamps: true, toObject: { getters: true } })
export class PagesList {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String })
  airtable_id?: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  url: string = '';

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String, index: true })
  lang?: 'en' | 'fr' | '';

  @Prop({ type: String })
  last_255?: string;

  @Prop() updatedAt?: Date;
}

export const PagesListSchema = SchemaFactory.createForClass(PagesList);

export const PagesListModel = model(PagesList.name, PagesListSchema);
