import { Injectable } from '@nestjs/common';
import { CreateOverallDto } from './dto/create-overall.dto';
import { UpdateOverallDto } from './dto/update-overall.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Overall, OverallDocument } from '@cra-arc/db';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class OverallService {
  constructor(
    @InjectModel(Overall.name) private overallModel: Model<OverallDocument>
  ) {}

  create(createOverallDto: CreateOverallDto) {
    return 'This action adds a new overall';
  }

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

  findOne(id: string) {
    return `This action returns a #${id} overall`;
  }

  update(id: string, updateOverallDto: UpdateOverallDto) {
    return `This action updates a #${id} overall`;
  }

  remove(id: string) {
    return `This action removes a #${id} overall`;
  }
}
