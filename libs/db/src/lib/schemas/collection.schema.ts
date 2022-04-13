import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false, discriminatorKey: '_type', autoIndex: false })
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
  overwriteModels?: boolean;
}) => {
  console.log(collectionModel.discriminators);
  if (collectionModel.discriminators && collectionModel.discriminators[config.name]) {
    return collectionModel.discriminators[config.name];
  }

  return collectionModel.discriminator(
    config.name,
    config.schema,
  );
};

CollectionSchema.index({ _type: 1, date: 1, url: 1 });
