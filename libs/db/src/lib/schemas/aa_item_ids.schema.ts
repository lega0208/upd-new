import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AAItemIdTypes = 'internalSearch' | 'activityMap' | 'urlLast255' | 'pageUrl';

export interface AAItemIdInterface {
  _id: Types.ObjectId;
  type: AAItemIdTypes;
  page?: Types.ObjectId;
  itemId: string;
  value: string;
}

export type AAItemIdsDocument = AAItemId & Document;

@Schema({ collection: 'aa_item_ids' })
export class AAItemId
  implements AAItemIdInterface
{
  @Prop({ type: Types.ObjectId, required: true })
  _id = new Types.ObjectId();

  @Prop({ type: String, index: true })
  type!: AAItemIdTypes;

  @Prop({ type: Types.ObjectId, index: true })
  page?: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  itemId!: string;

  @Prop({ type: String, required: true, index: true })
  value!: string;
}

export const AAItemIdSchema = SchemaFactory.createForClass(AAItemId);
