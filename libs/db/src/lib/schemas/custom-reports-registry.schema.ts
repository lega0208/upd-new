import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import type { ReportConfig } from '@dua-upd/types-common';

const ReportConfigSchema = new MongooseSchema<ReportConfig>({
  dateRange: {
    type: {
      start: Date,
      end: Date,
    },
    required: true,
    _id: false,
  },
  granularity: {
    type: String,
    enum: ['day', 'week', 'month', 'year', 'none'],
    required: true,
  },
  urls: {
    type: [String],
    required: true,
  },
  grouped: {
    type: Boolean,
    required: true,
  },
  metrics: {
    type: [String],
    required: true,
  },
  breakdownDimension: { type: String, required: false },
}, { _id: false });

@Schema({ collection: 'custom_reports_registry' })
export class CustomReportsRegistry {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: ReportConfigSchema, required: true })
  config: ReportConfig<Date>;

  @Prop({ type: String, required: true, unique: true })
  configHash: string;
}

export const CustomReportsRegistrySchema = SchemaFactory.createForClass(
  CustomReportsRegistry,
);
