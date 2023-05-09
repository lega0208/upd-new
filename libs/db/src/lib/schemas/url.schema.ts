import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { IUrl } from '@dua-upd/types-common';

export type UrlDocument = Url & Document;

@Schema({ collection: 'urls' })
export class Url implements IUrl {
  @Prop({ type: Types.ObjectId, required: true })
  _id = new Types.ObjectId();

  @Prop({ type: String, required: true, unique: true })
  url: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: Types.ObjectId, sparse: true })
  page?: Types.ObjectId;

  @Prop({ type: [String], index: true })
  redirect?: string;

  @Prop({ type: Date, index: true })
  last_checked?: Date;

  @Prop({ type: Date, index: true })
  last_modified?: Date;

  @Prop({ type: Boolean, required: true, index: true })
  is_404?: boolean;

  @Prop({ type: String })
  latest_hash?: string;

  @Prop({ type: String })
  latest_snapshot?: string;
}

export const UrlSchema = SchemaFactory.createForClass(Url);
