/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
export declare type SearchAssessmentDocument = SearchAssessment & Document;
export declare class SearchAssessment {
  _id: Types.ObjectId;
  date: Date;
  lang: string;
  query: string;
  expected_result?: string;
  expected_position?: number;
  pass?: boolean;
  visits: number;
}
export declare const SearchAssessmentSchema: import('mongoose').Schema<Document<SearchAssessment, any, any>,Model<Document<SearchAssessment, any, any>, any, any, any>, {}, {}>;
export declare function getSearchAssessmentModel(): Model<
  Document<SearchAssessment>
>;
