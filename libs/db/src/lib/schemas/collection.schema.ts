import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false, discriminatorKey: '_type' })
export class Collection {
  @Prop({ type: String, required: true, index: true })
  _type = '';
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

export const collectionModel = mongoose.model(
  Collection.name,
  CollectionSchema
);

export const registerDiscriminator = (config: {
  name: string;
  schema: mongoose.Schema;
  value?: string;
}) => {
  return collectionModel.discriminator(
    config.name,
    config.schema
  );
};

CollectionSchema.index({ _type: 1, date: 1, url: 1 });
