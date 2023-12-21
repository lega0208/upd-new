import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema, Model } from 'mongoose';
import type {
  ICustomReportsMetrics,
  ReportConfig,
  ReportGranularity,
} from '@dua-upd/types-common';
import { filter, mapObject } from 'rambdax';

export const granularities: readonly ReportGranularity[] = [
  'day',
  'week',
  'month',
  'year',
  'none',
] as const;

@Schema({ collection: 'custom_reports_metrics' })
export class CustomReportsMetrics implements ICustomReportsMetrics {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: String, required: false, index: true })
  url?: string;

  @Prop({ type: [String], required: false, index: true })
  urls?: string[];

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: granularities,
    required: true,
    index: true,
  })
  granularity: ReportGranularity;

  @Prop({ type: Boolean, required: true, index: true })
  grouped: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false, index: true })
  metrics: ICustomReportsMetrics['metrics'] = {};

  // for breakdowns by dimension
  @Prop({ type: MongooseSchema.Types.Mixed, required: false, index: true })
  metrics_by: ICustomReportsMetrics['metrics_by'] = {};

  static async getMetrics(
    this: Model<CustomReportsMetrics>,
    config: ReportConfig,
  ) {
    const urls = config.grouped
      ? {
          urls: { $all: config.urls, $size: config.urls.length },
        }
      : {
          url: { $in: config.urls },
        };

    const dates =
      config.granularity === 'day'
        ? {
            startDate: {
              $gte: new Date(config.dateRange.start),
              $lte: new Date(config.dateRange.end),
            },
          }
        : {
            startDate: {
              $gte: new Date(config.dateRange.start),
              $lte: new Date(config.dateRange.end),
            },
            endDate: {
              $gte: new Date(config.dateRange.start),
              $lte: new Date(config.dateRange.end),
            },
          };

    const query = {
      ...urls,
      ...dates,
      grouped: config.grouped,
      granularity: config.granularity,
    };

    return (await this.find(query).lean().exec()) || [];
  }

  static createReportFormatter(config: ReportConfig) {
    const { metrics, granularity, grouped, breakdownDimension } = config;
    const toDates = (document: ICustomReportsMetrics) =>
      granularity === 'day'
        ? { date: document.startDate }
        : { startDate: document.startDate, endDate: document.endDate };

    type Metrics = { [p: string]: { [metricName: string]: number } };

    const filterMetrics = filter((v, k) => metrics.includes(k));

    const filterDimensionMetrics = mapObject(filterMetrics);

    const docToRows = (document: ICustomReportsMetrics) => {
      const dates = toDates(document);

      if (breakdownDimension) {
        const dimensionMetricsByValue: Record<string, Metrics> =
          filterDimensionMetrics(document.metrics_by[breakdownDimension]);

        return Object.entries(dimensionMetricsByValue).map(
          ([dimensionValue, dimensionMetrics]) => ({
            ...dates,
            url: document.url,
            [breakdownDimension]: dimensionValue,
            ...dimensionMetrics,
          }),
        );
      }

      const docMetrics: Metrics = filterMetrics(document.metrics);

      return {
        ...dates,
        url: document.url,
        ...docMetrics,
      };
    };

    const sortRows = (a, b) => {
      const aDate = a.startDate || a.date;
      const bDate = b.startDate || b.date;

      const dateCompare = aDate.getTime() - bDate.getTime();

      return dateCompare !== 0 ? dateCompare : a.url.localeCompare(b.url);
    };

    if (!grouped) {
      return (documents: ICustomReportsMetrics[]) =>
        documents.flatMap(docToRows).sort(sortRows);
    }

    // TODO: ungrouped
  }

  static async getReport(
    this: CustomReportsModel,
    config: ReportConfig,
  ) {
    const formatter = this.createReportFormatter(config);
    const metrics = await this.getMetrics(config);

    return formatter(metrics);
  }
}

export const CustomReportsMetricsSchema =
  SchemaFactory.createForClass(CustomReportsMetrics);

CustomReportsMetricsSchema.statics = {
  getMetrics: CustomReportsMetrics.getMetrics,
  getReport: CustomReportsMetrics.getReport,
  createReportFormatter: CustomReportsMetrics.createReportFormatter,
};

export type CustomReportsModel = Model<CustomReportsMetrics> & {
  getMetrics: typeof CustomReportsMetrics.getMetrics;
  getReport: typeof CustomReportsMetrics.getReport;
  createReportFormatter: typeof CustomReportsMetrics.createReportFormatter;
};

CustomReportsMetricsSchema.index(
  { url: 1, startDate: 1, endDate: 1, grouped: 1, granularity: 1 },
  {
    partialFilterExpression: {
      url: { $exists: true },
      grouped: false,
    },
    unique: true,
  },
);

CustomReportsMetricsSchema.index(
  { urls: 1, startDate: 1, endDate: 1, grouped: 1, granularity: 1 },
  {
    partialFilterExpression: {
      urls: { $exists: true },
      grouped: true,
    },
    unique: true,
  },
);

CustomReportsMetricsSchema.index(
  { url: 1, startDate: 1, grouped: 1, granularity: 1 },
  {
    partialFilterExpression: {
      url: { $exists: true },
      grouped: false,
      granularity: 'day',
    },
    unique: true,
  },
);

CustomReportsMetricsSchema.index(
  { urls: 1, startDate: 1, grouped: 1, granularity: 1 },
  {
    partialFilterExpression: {
      urls: { $exists: true },
      grouped: true,
      granularity: 'day',
    },
    unique: true,
  },
);
