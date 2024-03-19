import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AirtableClient } from '@dua-upd/external-data';
import { GCTasksMappings, GCTasksMappingsDocument, GCTasksMappingsModel, Task } from '@dua-upd/db';
import { Model } from 'mongoose';
import { Retry, arrayToDictionary } from '@dua-upd/utils-common';

@Injectable()
export class GCTasksMappingsService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    private logger: ConsoleLogger,
    @InjectModel(Task.name, 'defaultConnection')
    private taskModel: Model<Task>,
    @InjectModel(GCTasksMappings.name, 'defaultConnection')
    private gcTasksMappingsModel: Model<GCTasksMappingsDocument>
  ) {}

  @Retry(4, 1000)
  async updateGCTasksMappings() {
    this.logger.log('Updating GC Tasks Mappings...');

    // GC Tasks Mappings collection
    const gcTasksMappingsModel = await this.gcTasksMappingsModel;

    // Tasks collection
    const tasks = await this.taskModel;

    // GC Tasks Mappings client
    const gcTasksMappingsClient = this.airtableClient;

    // Get all the tasks airtable ids
    const taskIds = await tasks.find({}, { airtable_id: 1 }).lean().exec();

    // Create dictionary
    const taskIdsDict = arrayToDictionary(taskIds, 'airtable_id');

    // Replace airtable ids with the ObjectIds
    const gcTasksMappings = (await gcTasksMappingsClient.getGCTasksMappings()).map(
      (gcTasksMapping) => ({
        ...gcTasksMapping,
        tasks: gcTasksMapping.tasks?.map(
          (id) => taskIdsDict[id]._id
        ),
      })
    );

    // Create a bulk write
    const bulkWriteOps = gcTasksMappings.map((gcTasksMapping) => ({
      updateOne: {
        filter: { airtable_id: gcTasksMapping.airtable_id },
        update: {
          $set: gcTasksMapping,
        },
        upsert: true,
      },
    }));

    // Delete
    await gcTasksMappingsModel.deleteMany({});

    // Bulk write
    await gcTasksMappingsModel.bulkWrite(bulkWriteOps);
  }
}
