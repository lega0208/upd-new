import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Overall, OverallDocument } from '@cra-arc/db';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class OverallService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>
  ) {}

  async getMetrics(dateRange: {
    endDate?: string;
    startDate?: string;
  }): Promise<Overall[]> {
    const dateQuery: FilterQuery<Date> = {};

    if (dateRange.startDate) {
      dateQuery.$gte = new Date(dateRange.startDate);
    }

    if (dateRange.endDate) {
      dateQuery.$lte = new Date(dateRange.endDate);
    }

    return this.overallModel.find({ date: dateQuery }).sort({ date: 1 }).exec();
  }

  async getVisits(): Promise<Pick<Overall, 'visits' & 'date'>[]> {
    // hardcoded everything for now, just to demo
    return this.overallModel.find(
      {
        date: {
          $gte: new Date('2022-02-06'),
          $lte: new Date('2022-02-19'),
        }
      },
      { _id: 0, visits: 1, date: 1 }
    ).sort({ date: 1 });
  }
}
