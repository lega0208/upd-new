import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type { ReadabilityData } from '@dua-upd/types-common';

export type ReadabilityDocument = Readability & Document;

@Schema({ collection: 'readability' })
export class Readability {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: Date, required: true })
  date = new Date(0);

  @Prop({ type: String, required: true })
  final_fk_score = '0';

  @Prop({ type: String, required: true })
  fkpoints = '0';

  @Prop({ type: String, required: true })
  hpoints = '0';

  @Prop({ type: String, required: true })
  hratio = '0';

  @Prop({ type: Number, required: true })
  len_headings = 0;

  @Prop({ type: Number, required: true })
  len_par = 0;

  @Prop({ type: String, required: true })
  original_score = '0';

  @Prop({ type: String, required: true })
  ppoints = '0';

  @Prop({ type: String, required: true })
  pratio = '0';

  @Prop({
    type: [{ word: String, count: Number }],
  })
  data_word: { word: string; count: number }[];

  @Prop({ type: Number, required: true })
  total_score = 0;

  @Prop({ type: Number, required: true })
  total_words = 0;

  @Prop({ type: Number, required: true })
  total_sentences = 0;

  @Prop({ type: Number, required: true })
  total_syllables = 0;
}

export const ReadabilitySchema = SchemaFactory.createForClass(Readability);

ReadabilitySchema.index({ url: 1, date: 1 });

export function getReadabilityModel() {
  return model(Readability.name, ReadabilitySchema);
}

ReadabilitySchema.statics['getReadability'] = async function (
  url: string,
  dateRange: string
) {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate<Readability>()
    .sort({ url: 1, date: 1 })
    .match({ date: { $gte: startDate, $lte: endDate }, url: url })
    .exec();
};

export interface ReadabilityModel extends Model<ReadabilityDocument> {
  getReadability(
    dateRange: string,
    language: string
  ): Promise<ReadabilityData[]>;
}
