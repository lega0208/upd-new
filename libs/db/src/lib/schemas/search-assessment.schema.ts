import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { model, Document, Model, Types } from 'mongoose';
import type { SearchAssessmentData } from './types';

export type SearchAssessmentDocument = SearchAssessment & Document;

@Schema({ collection: 'search_assessment' })
export class SearchAssessment {
  @Prop({ required: true })
  _id: Types.ObjectId = new Types.ObjectId();

  @Prop({ type: Date, required: true, index: true })
  date: Date = new Date(0);

  @Prop({ type: String, required: true, index: true })
  lang?: 'en' | 'fr' | '';

  @Prop({ type: String, required: true, index: true })
  query = '';

  @Prop({ type: String, index: true })
  expected_result = '';

  @Prop({ type: Number, index: true })
  expected_position = 0;

  @Prop({ type: Boolean, index: true })
  pass = false;

  @Prop({ type: Number, required: true, index: true })
  clicks = 0;
}

export const SearchAssessmentSchema =
  SchemaFactory.createForClass(SearchAssessment);

SearchAssessmentSchema.index({ date: 1, lang: 1 });

export function getSearchAssessmentModel() {
  return model(SearchAssessment.name, SearchAssessmentSchema);
}

SearchAssessmentSchema.statics['getSAT'] = async function (
  dateRange: string,
  language: string
) {
  const [startDate, endDate] = dateRange.split('/').map((d) => new Date(d));

  return this.aggregate<SearchAssessmentData>()
    .sort({ date: 1, lang: 1 })
    .match({ date: { $gte: startDate, $lte: endDate }, lang: language })
    .project({
      lang: 1,
      date: 1,
      query: 1,
      expected_url: 1,
      expected_position: 1,
      pass: 1,
      clicks: 1,
    })
    .exec();
};

export interface SearchAssessmentModel extends Model<SearchAssessmentDocument> {
  getSAT(dateRange: string, language: string): Promise<SearchAssessmentData[]>;
}
