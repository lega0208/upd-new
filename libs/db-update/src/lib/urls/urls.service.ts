import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { AnyBulkWriteOperation } from 'mongodb';
import { minify } from 'html-minifier-terser';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { DbService, Url } from '@dua-upd/db';
import { BlobLogger } from '@dua-upd/logger';
import type { UrlHash } from '@dua-upd/types-common';
import {
  arrayToDictionary,
  HttpClient,
  HttpClientResponse,
  logJson,
  today,
} from '@dua-upd/utils-common';

@Injectable()
export class UrlsService {
  private readonly DATA_BLOB_NAME = 'urls-collection-data.json';
  private readonly http = new HttpClient({
    logger: this.logger,
    rateLimitStats: true,
    rateLimitDelay: 80,
    batchSize: 15,
  });

  constructor(
    private db: DbService,
    @Inject('DB_UPDATE_LOGGER') private logger: BlobLogger,
    @Inject(BlobStorageService.name) private blobService: BlobStorageService,
    @Inject('ENV') private production: boolean
  ) {}

  private async getBlobClient() {
    return this.blobService.blobModels.urls.blob(this.DATA_BLOB_NAME);
  }

  async updateCollectionFromBlobStorage() {
    try {
      const blobClient = await this.getBlobClient();

      if (!(await blobClient.exists())) {
        this.logger.log(`Collection data blob does not exist.`);
        return;
      }

      const blobProperties = await blobClient.getProperties();

      const blobDate = blobProperties.metadata?.date
        ? new Date(blobProperties.metadata.date)
        : blobProperties.lastModified;

      const collectionDate = (await this.db.collections.urls
        .findOne(
          {},
          { _id: 0, last_checked: 1 },
          { sort: { last_checked: -1 } }
        )
        .lean()
        .exec())?.last_checked;

      if (collectionDate && dayjs(collectionDate).add(1, 'day').isAfter(blobDate)) {
        this.logger.log(`Collection data is up to date.`);
        return;
      }

      this.logger.log(`Downloading collection data from blob storage...`);

      const collectionData = await blobClient.downloadToString();

      this.logger.log(`Inserting data into collection...`);

      const jsonReviver = (key, value) => {
        if (key === 'last_checked' || key === 'last_updated') {
          return new Date(value);
        }

        if (key === '_id' || key === 'page') {
          return new Types.ObjectId(value);
        }

        if (key === 'hashes') {
          return value.map((hash) => ({
            ...hash,
            date: new Date(hash.date),
          }));
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

  async updateUrls() {
    if (!this.production) {
      await this.updateCollectionFromBlobStorage();

      return;
    }

    await this.updateCollectionFromPageUrls();

    this.logger.info('Checking Urls collection to see what URLs to update.');

    const oneWeekAgo = today().subtract(7, 'days').add(1, 'minute').toDate();

    const ignoredUrls = [
      'www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/completing-filing-information-returns/t4a-information-payers/t4a-slip/distribute-your-t4a-slips.html',
      'www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/retenues-paie/remplir-produire-declarations-renseignements/t4a-information-payeurs/feuillet-t4a/comment-distribuer-vos-feuillets-t4a.html',
      'canada-preview.adobecqms.net/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/information-medical-practitioners/life-sustaining-therapy-video-alternative-formats-transcript.html',
      'canada-preview.adobecqms.net/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/information-medical-practitioners/cumulative-effect-video-alternative-formats-transcript.html',
      'canada-preview.adobecqms.net/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/information-medical-practitioners/vision-video-alternative-formats-transcript.html',
      'canada-preview.adobecqms.net/fr/agence-revenu/services/impot/particuliers/segments/deductions-credits-impot-personnes-handicapees/renseignements-professionnels-sante/soins-therapeutiques-essentiels-video-formats-remplacement-transcription.html',
      'canada-preview.adobecqms.net/fr/agence-revenu/services/impot/particuliers/segments/deductions-credits-impot-personnes-handicapees/renseignements-professionnels-sante/effet-cumulatif-video-formats-remplacement-transcription.html',
      'canada-preview.adobecqms.net/fr/agence-revenu/services/impot/particuliers/segments/deductions-credits-impot-personnes-handicapees/renseignements-professionnels-sante/voir-transcription-medias-substituts.html',
    ];

    const urlsFromCollection = (
      await this.db.collections.urls
        .find({
          $or: [
            { last_checked: null },
            {
              is_404: {
                $in: [null, false],
              },
              last_checked: { $lt: oneWeekAgo },
            },
          ],
        })
        .lean()
        .exec()
    ).filter(
      // filter out pages that have an endless redirect loop
      (urlDoc) => !ignoredUrls.includes(urlDoc.url)
    );

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

    throw new Error(
      'Urls collection should be populated, but no data was found.'
    );
  }

  private async checkAndUpdateUrlData(urls: Url[]) {
    const urlsDataDict = arrayToDictionary(urls, 'url');

    const pageUrls = (
      await this.db.collections.pages.find({}, { all_urls: 1 }).lean().exec()
    )?.flatMap(({ _id, all_urls }) =>
      all_urls.map((url): { page: Types.ObjectId; url: string } => ({
        page: _id,
        url,
      }))
    );

    const urlsPageDict = arrayToDictionary(pageUrls, 'url');

    // using an update queue to batch updates rather than flooding the db with requests
    const updateQueue: AnyBulkWriteOperation<Url>[] = [];

    const flushQueue = async () => {
      const tempQueue: AnyBulkWriteOperation<Url>[] = [];

      while (updateQueue.length) {
        tempQueue.push(updateQueue.pop());
      }

      await this.db.collections.urls.bulkWrite(tempQueue);

      return;
    };

    const addToQueue = async (urlData: Url & { hash?: UrlHash }) => {
      if (updateQueue.length >= 10) {
        await flushQueue();
      }

      const idUrl = { _id: urlData._id, url: urlData.url };

      delete urlData._id;
      delete urlData.url;

      if (!urlData.hash) {
        const updateOp: AnyBulkWriteOperation<Url> = {
          updateOne: {
            filter: {
              _id: idUrl._id,
            },
            update: {
              $setOnInsert: {
                ...idUrl,
              },
              $set: {
                ...urlData,
              },
              upsert: true,
            },
          },
        };

        updateQueue.push(updateOp);

        return;
      }

      const hash = urlData.hash;

      delete urlData.hash;

      const updateOp: AnyBulkWriteOperation<Url> = {
        updateOne: {
          filter: {
            _id: idUrl._id,
          },
          update: {
            $setOnInsert: {
              ...idUrl,
            },
            $set: {
              ...urlData,
            },
            $addToSet: {
              hashes: hash,
            },
          },
          upsert: true,
        },
      };

      updateQueue.push(updateOp);
    };

    try {
      await this.http.getAll(
        urls.map(({ url }) => url),
        async (response: HttpClientResponse) => {
          const date = new Date();

          const collectionData =
            urlsDataDict[response.url] ||
            urlsDataDict[`https://${response.url}`];

          if (!collectionData) {
            console.error(response.url);
            logJson(
              Object.keys(urlsDataDict).filter(
                (url) => url.search(response.url) !== -1
              )
            );

            throw new Error(
              `No collection data found for url ${response.url}.`
            );
          }

          const redirect = response.redirect
            ? { redirect: response.redirect }
            : {};

          if (response.is404) {
            return await addToQueue({
              _id: collectionData._id,
              url: collectionData.url,
              last_checked: date,
              last_modified: date,
              is_404: true,
              ...redirect,
            });
          }

          // this means it was rate limited, so just ignore it, and it'll be checked again later
          if (response.title === 'Access Denied') {
            return;
          }

          const hash = createHash('md5').update(response.body).digest('hex');

          if (
            collectionData?.hashes &&
            collectionData.hashes.map(({ hash }) => hash).includes(hash)
          ) {
            // current hash has already been saved previously -- can skip
            // (just update last_checked in db)
            try {
              await addToQueue({
                _id: collectionData._id,
                url: collectionData.url,
                last_checked: date,
                ...redirect,
              });
            } catch (err) {
              this.logger.error('Error updating Url collection data:');
              this.logger.error(err.stack);
            }

            return;
          }

          const urlBlob = this.blobService.blobModels.urls.blob(hash);



          // if blob already exists, add the url to it's metadata if it's not already there
          if (await urlBlob.exists()) {
            const metadata = (await urlBlob.getProperties()).metadata;
            const urls: string[] = JSON.parse(metadata.urls);

            if (!urls.includes(response.url)) {
              urls.push(response.url);

              await urlBlob.setMetadata({
                ...metadata,
                urls: JSON.stringify(urls),
              });
            }
          } else {
            try {
              // if html is malformed, minifying will fail.
              // we'll wrap it in a try/catch and upload it as-is if that happens
              const minifiedBody: string = await minify(response.body, {
                collapseWhitespace: true,
                conservativeCollapse: true,
                continueOnParseError: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                sortAttributes: true,
                sortClassName: true,
              });

              await urlBlob.uploadFromString(minifiedBody, {
                metadata: {
                  urls: JSON.stringify([response.url]),
                  date: date.toISOString(),
                },
              });
            } catch {
              await urlBlob.uploadFromString(response.body, {
                metadata: {
                  urls: JSON.stringify([response.url]),
                  date: date.toISOString(),
                },
              });
            }
          }

          try {
            const page = urlsPageDict[response.url]
              ? { page: urlsPageDict[response.url].page }
              : {};

            return await addToQueue({
              _id: collectionData._id,
              url: response.url,
              title: response.title,
              ...page,
              ...redirect,
              last_checked: date,
              last_modified: date,
              is_404: false,
              hash: { hash, date },
              latest_snapshot: urlBlob.url,
            });
          } catch (err) {
            this.logger.error(
              'An error occurred when inserting Url data to db:'
            );
            this.logger.error(err.stack);
          }
        }
      );

      await this.saveCollectionToBlobStorage();
    } catch (err) {
      this.logger.error('An error occurred during http.getAll():');
      this.logger.error(err.stack);
    } finally {
      // commit any remaining updates
      await flushQueue();
    }

    this.logger.info('Urls updates completed.');
  }

  private async updateCollectionFromPageUrls() {
    this.logger.log('Checking Pages collection for any new urls...');

    const currentUrls =
      (await this.db.collections.urls
        .find({}, { _id: 0, url: 1 })
        .distinct('url')) || [];

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
      all_urls
        .filter((url) => !currentUrls.includes(url))
        .map((url) => ({
          _id: new Types.ObjectId(),
          url,
          page,
        }))
    );

    if (!urlDocs.length) {
      this.logger.log(`No new urls found.`);

      return;
    }

    await this.db.collections.urls.insertMany(urlDocs);

    this.logger.log(`${urlDocs.length} new urls added.`);
  }

  async saveCollectionToBlobStorage() {
    this.logger.log('Saving urls data to blob storage...');

    try {
      const blobClient = await this.getBlobClient();

      if (await blobClient.exists()) {
        const date = new Date((await blobClient.getProperties()).metadata.date);

        const newData = await this.db.collections.urls
          .findOne({ last_modified: { $gt: date } })
          .lean()
          .exec();

        if (!newData) {
          this.logger.log('No new data added. Skipping upload to storage.');

          return;
        }

        this.logger.accent(
          `Overwriting url data from date: ${date.toISOString()}`
        );
      }

      const data = await this.db.collections.urls.find().lean().exec();

      const newDate = new Date();

      await blobClient.uploadFromString(JSON.stringify(data), {
        metadata: { date: newDate.toISOString() },
      });
    } catch (err) {
      this.logger.error(
        `An error occurred uploading collection to blob storage:`
      );
      this.logger.error(err.stack);
    }
  }
}
