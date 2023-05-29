import { Inject, Injectable, Optional } from '@nestjs/common';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import { FilterQuery, Types } from 'mongoose';
import { AnyBulkWriteOperation } from 'mongodb';
import { minify } from 'html-minifier-terser';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { DbService, Page, Readability, Url } from '@dua-upd/db';
import { BlobLogger } from '@dua-upd/logger';
import type { UrlHash } from '@dua-upd/types-common';
import { md5Hash } from '@dua-upd/node-utils';
import {
  arrayToDictionary,
  HttpClient,
  HttpClientResponse,
  today,
} from '@dua-upd/utils-common';
import { ReadabilityService } from '../readability/readability.service';
import { omit } from 'rambdax';

export type UpdateUrlsOptions = {
  urls?: {
    check404s?: boolean;
    checkAll?: boolean;
    filter?: FilterQuery<Page>;
  };
  forceReadability?: boolean;
};

@Injectable()
export class UrlsService {
  private readonly DATA_BLOB_NAME = 'urls-collection-data.json';
  private readonly READABILITY_BLOB_NAME = 'readability-collection-data.json';
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
    @Inject('ENV') private production: boolean,
    @Optional() private readability: ReadabilityService
  ) {}

  private async getBlobClient() {
    return this.blobService.blobModels.urls.blob(this.DATA_BLOB_NAME);
  }

  private async getReadabilityBlobClient() {
    return this.blobService.blobModels.urls.blob(this.READABILITY_BLOB_NAME);
  }

  async preparePagesCollection() {
    // We mostly just want to make sure that Pages don't have "duplicated" urls
    // specifically, cases where two versions of a url exist,
    // one with "https://" and one without.

    // also remove the url "x"
    await this.db.collections.pages.updateMany(
      {},
      { $pull: { all_urls: 'x' } }
    );

    const pagesToUpdate = await this.db.collections.pages
      .find({ all_urls: /^https:/i }, { all_urls: 1 })
      .lean()
      .exec();

    const updateOps: AnyBulkWriteOperation<Page>[] = [];

    for (const page of pagesToUpdate) {
      const allUrls = page.all_urls;

      const dedupedUrls = [
        ...new Set(allUrls.map((url) => url.replace(/^https?:\/\//i, ''))),
      ];

      updateOps.push({
        updateOne: {
          filter: { _id: page._id },
          update: { $set: { all_urls: dedupedUrls } },
        },
      });
    }

    await this.db.collections.pages.bulkWrite(updateOps);
  }

  async updateCollectionFromBlobStorage() {
    try {
      const blobClient = await this.getBlobClient();

      if (!(await blobClient.exists())) {
        this.logger.warn(
          `Tried to sync local Urls collection, but data blob does not exist.`
        );
        return;
      }

      const blobProperties = await blobClient.getProperties();

      const blobDate = blobProperties.metadata?.date
        ? new Date(blobProperties.metadata.date)
        : blobProperties.lastModified;

      const collectionDate = (
        await this.db.collections.urls
          .findOne({}, { last_checked: 1 }, { sort: { last_checked: -1 } })
          .lean()
          .exec()
      )?.last_checked;

      if (
        collectionDate &&
        dayjs(collectionDate).add(1, 'day').isAfter(blobDate)
      ) {
        this.logger.log(`Collection data is up to date.`);
        return;
      }

      this.logger.log(`Downloading collection data from blob storage...`);

      const blobData = await blobClient.downloadToString();

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
        blobData,
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
        { ordered: true }
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

  async updateReadabilityFromBlobStorage() {
    const blobClient = await this.getReadabilityBlobClient();

    if (!(await blobClient.exists())) {
      this.logger.warn(
        `Tried to sync local Readability collection, but data blob does not exist.`
      );
      return;
    }

    const currentData = await this.db.collections.readability
      .find()
      .lean()
      .exec();

    // omit ObjectId fields to keep them from messing up the hash
    const omitObjectIds = omit(['_id', 'page']);

    const currentHash = md5Hash(currentData.map((doc) => omitObjectIds(doc)));

    const blobHash = (await blobClient.getProperties()).metadata?.hash;

    if (currentHash === blobHash) {
      this.logger.log(`Readability data already up to date.`);
      return;
    }

    this.logger.log(`Downloading Readability data from blob storage...`);

    const blobData = await blobClient.downloadToString();

    this.logger.log(`Inserting data into collection...`);

    const jsonReviver = (key, value) => {
      if (key === 'date') {
        return new Date(value);
      }

      if (key === '_id' || key === 'page') {
        return new Types.ObjectId(value);
      }

      return value;
    };

    // references could still get out of sync, but only in dev, so not a huge deal
    // could always update the references after the fact if necessary

    const omitObjectIdsAndDate = omit(['_id', 'date', 'page']);

    const bulkWriteOps: AnyBulkWriteOperation<Readability>[] = JSON.parse(
      blobData,
      jsonReviver
    ).map(
      (readability: Readability) =>
        ({
          updateOne: {
            filter: { url: readability.url, date: readability.date },
            update: {
              $setOnInsert: {
                _id: readability._id,
                page: readability.page,
                date: readability.date,
              },
              $set: omitObjectIdsAndDate(readability),
            },
            upsert: true,
          },
        } as AnyBulkWriteOperation<Readability>)
    );

    const bulkWriteResults = await this.db.collections.readability.bulkWrite(
      bulkWriteOps,
      { ordered: true }
    );

    this.logger.accent(
      `Bulk write results: ${JSON.stringify(bulkWriteResults, null, 2)}`
    );

    this.logger.log(`Readability collection successfully updated.`);
  }

  async updateUrls(options?: UpdateUrlsOptions) {
    if (
      options?.urls?.filter &&
      (options?.urls?.check404s || options?.urls?.checkAll)
    ) {
      throw new Error(
        'Cannot use filter option with check404s or checkAll options.'
      );
    }

    await this.preparePagesCollection();

    if (!this.production) {
      await this.updateCollectionFromBlobStorage();

      return;
    }

    await this.updateCollectionFromPageUrls();

    this.logger.info('Checking Urls collection to see what URLs to update.');

    const threeDaysAgo = today().subtract(3, 'days').add(2, 'hours').toDate();
    const twoWeeksAgo = today().subtract(2, 'weeks').add(2, 'hours').toDate();

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

    const filter404s = options?.urls?.check404s
      ? {}
      : {
          is_404: {
            $in: [null, false],
          },
        };

    const urlsQuery =
      options?.urls?.filter || options?.urls?.checkAll
        ? {}
        : {
            $or: [
              { last_checked: null },
              {
                ...filter404s,
                last_checked: { $lt: threeDaysAgo },
              },
              {
                is_404: true,
                last_checked: { $lt: twoWeeksAgo },
              },
            ],
          };

    const urlsFromCollection = (
      await this.db.collections.urls.find(urlsQuery).lean().exec()
    ).filter(
      // filter out pages that have an endless redirect loop
      (urlDoc) => !ignoredUrls.includes(urlDoc.url)
    );

    if (urlsFromCollection?.length) {
      this.logger.info(
        `Found ${urlsFromCollection.length} URLs from collection to check.`
      );

      return await this.checkAndUpdateUrlData(
        urlsFromCollection,
        options?.forceReadability
      );
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

  async assessReadability(
    content: string,
    metadata: { url: string; page: Types.ObjectId; hash: string; date: Date }
  ): Promise<Readability> {
    const langRegex = /canada\.ca\/(en|fr)/i;
    const lang = langRegex.exec(metadata.url)?.[1];

    if (!lang || (lang !== 'en' && lang !== 'fr')) {
      throw new Error(`Could not determine language for ${metadata.url}`);
    }

    const readabilityScore = await this.readability.calculateReadability(
      content,
      lang
    );

    return {
      _id: new Types.ObjectId(),
      lang,
      ...metadata,
      ...readabilityScore,
    };
  }

  private async checkAndUpdateUrlData(
    urls: Url[],
    forceReadabilityAssessment = false
  ) {
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
    const readabilityQueue: Readability[] = [];

    const flushQueues = async () => {
      const tempUpdateQueue: AnyBulkWriteOperation<Url>[] = [];
      const tempReadabilityQueue: Readability[] = [];

      while (updateQueue.length) {
        tempUpdateQueue.push(updateQueue.pop());
        tempReadabilityQueue.push(readabilityQueue.pop());
      }

      await this.db.collections.urls.bulkWrite(tempUpdateQueue);

      if (tempReadabilityQueue.length) {
        await this.db.collections.readability.insertMany(tempReadabilityQueue, {
          lean: true,
        });
      }

      return;
    };

    const addToQueues = async (
      urlData: Url & { hash?: UrlHash },
      readabilityScore?: Readability
    ) => {
      if (updateQueue.length >= 10 || readabilityQueue.length >= 10) {
        await flushQueues();
      }

      if (readabilityScore) {
        readabilityQueue.push(readabilityScore);
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
      const links = urlData.links;

      delete urlData.hash;
      delete urlData.links;

      const updateOp: AnyBulkWriteOperation<Url> = {
        updateOne: {
          filter: {
            _id: idUrl._id,
          },
          update: {
            $setOnInsert: idUrl,
            $set: urlData,
            $addToSet: {
              hashes: hash,
              links: {
                $each: links,
              },
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

          const collectionData = urlsDataDict[response.url];

          if (!collectionData) {
            throw new Error(
              `No collection data found for url ${response.url}.`
            );
          }

          const redirect = response.redirect
            ? { redirect: response.redirect }
            : {};

          if (response.is404) {
            return await addToQueues({
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

          const processedHtml = processHtml(response.body);

          // need to hash the processed html because of dynamically injected content
          const hash = md5Hash(processedHtml.body);

          const readabilityMetadata = {
            url: collectionData.url,
            page: collectionData.page,
            hash,
            date,
          };

          if (
            collectionData?.hashes &&
            collectionData.hashes.map(({ hash }) => hash).includes(hash)
          ) {
            // current hash has already been saved previously -- can skip
            // (just update last_checked in db)
            try {
              // if forceReadability, or if the hash has not been assessed
              if (
                forceReadabilityAssessment ||
                !(await this.db.collections.readability
                  .findOne({ hash })
                  .lean()
                  .exec())
              ) {
                const readabilityScore = await this.assessReadability(
                  processedHtml.body,
                  readabilityMetadata
                );

                return await addToQueues(
                  {
                    _id: collectionData._id,
                    url: collectionData.url,
                    last_checked: date,
                    links: processedHtml.links,
                    ...redirect,
                  },
                  readabilityScore
                );
              }

              return await addToQueues({
                _id: collectionData._id,
                url: collectionData.url,
                last_checked: date,
                links: processedHtml.links,
                ...redirect,
              });
            } catch (err) {
              this.logger.error(
                'Error updating Url collection data or assessing readability:'
              );
              this.logger.error(err.stack);
              return;
            }
          }

          const urlBlob = this.blobService.blobModels.urls.blob(hash);

          // if blob already exists, add the url to its blob metadata if it's not already there
          if (await urlBlob.exists()) {
            const blobMetadata = (await urlBlob.getProperties()).metadata;
            const urls: string[] = JSON.parse(blobMetadata.urls);

            if (!urls.includes(response.url)) {
              urls.push(response.url);

              await urlBlob.setMetadata({
                ...blobMetadata,
                urls: JSON.stringify(urls),
              });
            }
          } else {
            try {
              // if html is malformed, minifying will fail.
              // we'll wrap it in a try/catch and upload it as-is if that happens
              const minifiedBody: string = await minify(processedHtml.body, {
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
            } catch (err) {
              // If an error is caught here, it could either be because minifying failed,
              // or because the blob was uploaded from a "redirect" url after we
              // checked if it exists.

              if (/already exists/.test(err.message)) {
                // if already exists, set blob metadata like above
                const blobMetadata = (await urlBlob.getProperties()).metadata;
                const urls: string[] = JSON.parse(blobMetadata.urls);

                if (!urls.includes(response.url)) {
                  urls.push(response.url);

                  await urlBlob.setMetadata({
                    ...blobMetadata,
                    urls: JSON.stringify(urls),
                  });
                }
              } else {
                await urlBlob.uploadFromString(processedHtml.body, {
                  metadata: {
                    urls: JSON.stringify([response.url]),
                    date: date.toISOString(),
                  },
                });
              }
            }
          }

          try {
            const page = urlsPageDict[response.url]
              ? { page: urlsPageDict[response.url].page }
              : {};

            const readabilityScore = await this.assessReadability(
              processedHtml.body,
              readabilityMetadata
            );

            return await addToQueues(
              {
                _id: collectionData._id,
                url: response.url,
                title: response.title,
                ...page,
                metadata: processedHtml.metadata,
                links: processedHtml.links,
                ...redirect,
                last_checked: date,
                last_modified: date,
                is_404: false,
                hash: { hash, date },
                latest_snapshot: urlBlob.url,
              },
              readabilityScore
            );
          } catch (err) {
            this.logger.error(
              'An error occurred when inserting Url data to db:'
            );
            this.logger.error(err.stack);
          }
        },
        true
      );

      await this.saveCollectionToBlobStorage();
      await this.saveReadabilityToBlobStorage();
    } catch (err) {
      this.logger.error('An error occurred during http.getAll():');
      this.logger.error(err.stack);
    } finally {
      // commit any remaining updates
      await flushQueues();
    }

    this.logger.info('Urls and Readability updates completed.');
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

  async saveReadabilityToBlobStorage() {
    const blobClient = await this.getReadabilityBlobClient();

    const data = await this.db.collections.readability.find().lean().exec();

    if (!data) {
      this.logger.warn(
        'Tried to upload readability data, but collection is empty.'
      );
      return;
    }

    // hash data without any ObjectIds, because we can't depend on them staying the same
    const omitObjectIds = omit(['_id', 'page']);

    const hash = md5Hash(data.map((doc) => omitObjectIds(doc)));

    if (await blobClient.exists()) {
      // upload only if it has changed
      const blobMetadata = (await blobClient.getProperties()).metadata;

      if (blobMetadata.hash === hash) {
        this.logger.log('Readability data in blob storage already up to date.');
        return;
      }
    }

    this.logger.log('Saving readability data to blob storage...');

    await blobClient.uploadFromString(JSON.stringify(data), {
      metadata: { date: new Date().toISOString(), hash },
    });

    this.logger.log('Readability data saved to blob storage.');
  }
}

export const processHtml = (html: string) => {
  const $ = cheerio.load(html, {}, false);
  $('script, meta[property="fb:pages"]').remove();

  const metadata = Object.fromEntries(
    $('meta[name], meta[property]')
      .toArray()
      .filter(
        (meta) =>
          meta.attribs.name &&
          meta.attribs.content &&
          meta.attribs.content !== 'IE=edge' &&
          meta.attribs.content !== 'width=device-width,initial-scale=1'
      )
      .map((meta) => [meta.attribs.name, meta.attribs.content])
  );

  const links = $('main a[href]')
    .toArray()
    .map((a) => ({
      href: a.attribs.href
        .replace('https://', '')
        .replace(/^\/(en|fr)\//i, 'www.canada.ca/$1/'),
      text: $(a).text(),
    }));

  return {
    title: $('title').text(),
    body: $.html(),
    metadata,
    links,
  };
};
