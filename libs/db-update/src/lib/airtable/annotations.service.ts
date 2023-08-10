import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AirtableClient } from '@dua-upd/external-data';
import { Annotations, AnnotationsDocument, Task } from '@dua-upd/db';
import { Model } from 'mongoose';
import { Retry, arrayToDictionary } from '@dua-upd/utils-common';

@Injectable()
export class AnnotationsService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    private logger: ConsoleLogger,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<Task>,
    @InjectModel(Annotations.name, 'defaultConnection')
    private annotationsModel: Model<AnnotationsDocument>
  ) {}

  @Retry(4, 1000)
  async updateAnnotations() {
    this.logger.log('Updating annotations...');

    // Annotations collection
    const annotationsModel = await this.annotationsModel;

    // Tasks collection
    const tasks = await this.taskModel;

    // Annotations client
    const annotationsClient = this.airtableClient;

    // Get all the tasks airtable ids
    const taskIds = await tasks.find({}, { airtable_id: 1 }).lean().exec();

    // Create dictionary
    const taskIdsDict = arrayToDictionary(taskIds, 'airtable_id');

    // Replace airtable ids with the ObjectIds
    const annotations = (await annotationsClient.getAnnotations()).map(
      (annotation) => ({
        ...annotation,
        tasks_affected: annotation.tasks_affected?.map(
          (id) => taskIdsDict[id]._id
        ),
      })
    );

    // Create a bulk write
    const bulkWriteOps = annotations.map((annotation) => ({
      updateOne: {
        filter: { airtable_id: annotation.airtable_id },
        update: {
          $set: annotation,
        },
        upsert: true,
      },
    }));

    // Delete
    await annotationsModel.deleteMany({});

    // Bulk write
    await annotationsModel.bulkWrite(bulkWriteOps);
  }
}
