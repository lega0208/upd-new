/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/schemaoptions" />
import { Document, Model, Types } from 'mongoose';
export declare type ReadabilityDocument = Readability & Document;
export declare class Readability {
  _id: Types.ObjectId;
  url: string;
  date: Date;
  original_score: number;
  final_fk_score: number;
  fk_points: number;
  avg_words_per_paragraph: number;
  avg_words_per_header: number;
  paragraph_points: number;
  header_points: number;
  word_counts: { word: string; count: number }[];
  total_sentences: number;
  total_syllables: number;
  total_paragraph: number;
  total_headings: number;
  total_words: number;
  total_score: number;
}
export declare const ReadabilitySchema: import('mongoose').Schema<
  Document<Readability, any, any>,
  Model<Document<Readability, any, any>, any, any, any>,
  {},
  {}
>;
export declare function getReadabilityModel(): Model<Document<Readability>>;
