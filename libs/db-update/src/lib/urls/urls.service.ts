import { Inject, Injectable } from '@nestjs/common';
import { HttpClient, today } from '@dua-upd/utils-common';
import { DbService, Url } from '@dua-upd/db';
import { BlobLogger } from '@dua-upd/logger';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { Types } from 'mongoose';
import { AnyBulkWriteOperation } from 'mongodb';

@Injectable()
export class UrlsService {
  private http = new HttpClient({ logger: this.logger });

  constructor(
    private db: DbService,
    @Inject('DB_UPDATE_LOGGER') private logger: BlobLogger,
    @Inject(BlobStorageService.name)
    private blobService: BlobStorageService
  ) {}

  async updateCollectionFromBlobStorage() {
    const DATA_BLOB_NAME = 'collection-data.json';

    try {
      const collectionDataBlob = await this.blobService.blobModels.urls.blob(
        DATA_BLOB_NAME
      );

      if (!(await collectionDataBlob.exists())) {
        this.logger.log(`Collection data blob does not exist.`);
        return;
      }

      this.logger.log(`Downloading collection data from blob storage...`);

      const collectionData = await collectionDataBlob.downloadToString();

      this.logger.log(`Inserting data into collection...`);

      const jsonReviver = (key, value) => {
        if (key === 'last_checked' || key === 'last_updated') {
          return new Date(value);
        }

        if (key === '_id') {
          return new Types.ObjectId(value);
        }

        return value;
      };

      const bulkWriteOps: AnyBulkWriteOperation<Url>[] = JSON.parse(
        collectionData,
        jsonReviver
      ).map(
        (url) =>
          ({
            updateOne: {
              filter: { _id: url._id },
              update: { $set: url },
              upsert: true,
            },
          } as AnyBulkWriteOperation<Url>)
      );

      const bulkWriteResults = await this.db.collections.urls.bulkWrite(
        bulkWriteOps,
        { ordered: false }
      );

      this.logger.accent(
        `Bulk write results: ${JSON.stringify(bulkWriteResults, null, 2)}`
      );

      this.logger.log(`Urls collection successfully updated.`);
    } catch (err) {
      this.logger.error('Error updating urls collection from blob storage:');
      this.logger.error(err.stack);
    }
  }

  async updateUrls(production = false) {
    /// @@@@@@@@ TODO::: split logic into prod vs. dev
    // if dev -> update from blob storage
    // if prod -> get urls to check (or populate) -> do updates

    if (!production) {
      await this.updateCollectionFromBlobStorage();

      return;
    }

    this.logger.info('Checking Urls collection to see what URLs to update.');
    const oneWeekAgo = today().subtract(7, 'days').add(1, 'minute').toDate();

    const urlsFromCollection = await this.db.collections.urls
      .find({
        $or: [
          { last_checked: null },
          {
            is_404: false,
            last_checked: { $lt: oneWeekAgo },
          },
        ],
      })
      .lean()
      .exec();

    if (urlsFromCollection?.length) {
      this.logger.info(
        `Found ${urlsFromCollection.length} URLs from collection to check.`
      );

      return await this.checkAndUpdateUrlData(urlsFromCollection);
    }

    // check whether everything is up to date, or if collection is empty
    const anyUrlDoc = await this.db.collections.urls.findOne({}).lean().exec();

    if (anyUrlDoc) {
      this.logger.info('URL data is already up to date.');

      return;
    }

    this.logger.log('Urls collection is empty, and needs to be populated.');

    await this.populateCollectionFromPageUrls();

    const newUrlsFromCollection = await this.db.collections.urls
      .find({
        $or: [
          { last_checked: null },
          {
            is_404: false,
            last_checked: { $lt: oneWeekAgo },
          },
        ],
      })
      .lean()
      .exec();

    if (!newUrlsFromCollection?.length) {
      throw new Error(
        'Something went wrong while populating the urls collection. ' +
          'Collection should be populated, but no data was found.'
      );
    }

    // if collection was populated, that should mean that nothing's been checked yet
    await this.checkAndUpdateUrlData(newUrlsFromCollection);
  }

  async checkAndUpdateUrlData(urls: Url[]) {
    // todo
  }

  async populateCollectionFromPageUrls() {
    const pageUrls = (
      await this.db.collections.pages.find({}, { all_urls: 1 }).lean().exec()
    )?.map((page) => ({
      page: page._id,
      all_urls: page.all_urls,
    }));

    if (!pageUrls?.length) {
      throw new Error(
        'Could not populate urls collection. The pages collection seems to be empty.'
      );
    }

    const urlDocs: Url[] = pageUrls.flatMap(({ page, all_urls }) =>
      all_urls.map((url) => ({
        _id: new Types.ObjectId(),
        url,
        page,
      }))
    );

    await this.db.collections.urls.insertMany(urlDocs);
  }
}
