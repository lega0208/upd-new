import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type { ReadabilityData } from '@dua-upd/types-common';

export type ReadabilityDocument = Readability & Document;

@Schema({ collection: 'readability' })
export class Readability {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: Types.ObjectId, required: true, index: true })
  page: Types.ObjectId;
  
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: Date, required: true })
  date: Date = new Date(0);

  @Prop({ type: Number, required: true })
  original_score: number;

  @Prop({ type: Number, required: true })
  final_fk_score: number;

  @Prop({ type: Number, required: true })
  fk_points: number;

  @Prop({ type: Number, required: true })
  avg_words_per_paragraph: number;

  @Prop({ type: Number, required: true })
  avg_words_per_header: number;

  @Prop({ type: Number, required: true })
  paragraph_points: number;

  @Prop({ type: Number, required: true })
  header_points: number;

  @Prop({
    type: [{ word: String, count: Number }],
  })
  word_counts: { word: string; count: number }[];

  @Prop({ type: Number, required: true })
  total_sentences: number;

  @Prop({ type: Number, required: true })
  total_syllables: number;

  @Prop({ type: Number, required: true })
  total_paragraph: number;

  @Prop({ type: Number, required: true, default: 0 })
  total_headings: number;

  @Prop({ type: Number, required: true, default: 0 })
  total_words: number;

  @Prop({ type: Number, required: true })
  total_score: number;
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
