import { logJson } from '@dua-upd/utils-common';
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
          urls: {
            $all: config.urls.map((url) => ({ $elemMatch: { $eq: url } })),
            $size: config.urls.length,
          },
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

    logJson(query);

    return (await this.find(query).lean().exec()) || [];
  }

  static createReportFormatter<T extends { [columnName: string]: unknown }>(
    config: ReportConfig,
  ) {
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

      const urls = grouped ? {} : { url: document.url };

      if (breakdownDimension) {
        const dimensionMetricsByValue: Record<string, Metrics> =
          filterDimensionMetrics(
            document.metrics_by?.[breakdownDimension] || {},
          );

        return Object.entries(dimensionMetricsByValue).map(
          ([dimensionValue, dimensionMetrics]) => ({
            ...dates,
            ...urls,
            [breakdownDimension]: dimensionValue,
            ...dimensionMetrics,
          }),
        );
      }

      const docMetrics: Metrics = filterMetrics(document.metrics || {});

      if (Object.keys(docMetrics).length === 0) {
        // flatMap will filter out empty rows
        return [];
      }

      return {
        ...dates,
        ...urls,
        ...docMetrics,
      };
    };

    const sortRows = (a, b) => {
      const aDate = granularity === 'day' ? a.date : a.startDate;
      const bDate = granularity === 'day' ? b.date : b.startDate;

      const dateCompare = aDate.getTime() - bDate.getTime();
      const urlCompare = a.url?.localeCompare(b.url);
      const breakdownCompare = a[breakdownDimension]?.localeCompare(
        b[breakdownDimension],
      );

      return dateCompare !== 0 ? dateCompare : urlCompare || breakdownCompare;
    };

    return (documents: ICustomReportsMetrics[]) =>
      documents.flatMap(docToRows).sort(sortRows) as unknown as T[];
  }

  static async getReport(this: CustomReportsModel, config: ReportConfig) {
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
