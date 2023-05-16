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
  final_fk_score: string;
  fkpoints: string;
  hpoints: string;
  hratio: string;
  len_headings: number;
  len_par: number;
  original_score: string;
  ppoints: string;
  pratio: string;
  data_word: { word: string; count: number }[];
  total_score: number;
  total_words: number;
  total_sentences: number;
  total_syllables: number;
}
export declare const ReadabilitySchema: import('mongoose').Schema<
  Document<Readability, any, any>,
  Model<Document<Readability, any, any>, any, any, any>,
  {},
  {}
>;
export declare function getReadabilityModel(): Model<Document<Readability>>;
