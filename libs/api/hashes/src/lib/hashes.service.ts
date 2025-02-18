import { Inject, Injectable } from '@nestjs/common';
import { UrlHash } from '@dua-upd/types-common';
import { Cache } from 'cache-manager';
import { DbService, Page, PageDocument } from '@dua-upd/db';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HashesCache } from './hashes.cache';
import { wait } from '@dua-upd/utils-common';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { format } from 'prettier';

@Injectable()
export class HashesService {
  constructor(
    private db: DbService,
    @InjectModel(Page.name, 'defaultConnection')
    private pageModel: Model<PageDocument>,
    @Inject(BlobStorageService.name) private blob: BlobStorageService,
    private cache: HashesCache,
  ) {}

  async getHashes(id: string): Promise<UrlHash[]> {
    const urls = await this.db.collections.urls
      .find({ page: new Types.ObjectId(id) })
      .sort({ date: -1 })
      .lean()
      .exec();

    const hash = urls.map((url) => url.hashes).flat();

    const promises: Promise<UrlHash | void>[] = [];

    for (const h of hash) {
      if (!h) continue;

      const cachedBlob = await this.cache.get(h.hash);

      if (cachedBlob) {
        promises.push(
          Promise.resolve({
            hash: h.hash,
            date: h.date,
            blob: cachedBlob,
          }),
        );
      } else {
        if (!this.blob.blobModels.urls) {
          continue;
        }
        promises.push(
          this.blob.blobModels.urls
            .blob(h.hash)
            .downloadToString()
            .then(async (blob) => {
              if (!blob) {
                throw new Error('Blob is undefined');
              }
              const formattedBlob = await format(blob, { parser: 'html' });

              await this.cache.set(h.hash, formattedBlob);

              return {
                hash: h.hash,
                date: h.date,
                blob: formattedBlob,
              };
            })
            .catch((err) => {
              console.error(err);
            }),
        );

        await wait(30);
      }
    }

    const hashes = (await Promise.allSettled(promises))
      .filter((p) => p.status === 'fulfilled')
      .map((p) => p.value as UrlHash)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return hashes;
  }
}
