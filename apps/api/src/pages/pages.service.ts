import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Page, PageDocument } from '@cra-arc/db';
// import { CreatePageDto } from './dto/create-page.dto';
// import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(@InjectModel(Page.name) private pageModel: Model<PageDocument>) {}

  // create(createPageDto: CreatePageDto) {
  //   return 'This action adds a new page';
  // }

  async findAll(): Promise<Page[]> {
    return this.pageModel.find().exec();
  }

  findOne(id: string) {
    return `This action returns a #${id} page`;
  }

  // update(id: number, updatePageDto: UpdatePageDto) {
  //   return `This action updates a #${id} page`;
  // }

  remove(id: string) {
    return `This action removes a #${id} page`;
  }
}
