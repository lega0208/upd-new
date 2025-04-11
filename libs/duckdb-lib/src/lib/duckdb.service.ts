import { Inject, Injectable, BeforeApplicationShutdown } from '@nestjs/common';
import { drizzle, DuckDBDatabase } from '@duckdbfan/drizzle-duckdb';
import { Database, OPEN_READONLY, OPEN_READWRITE } from 'duckdb-async';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { BlobStorageService } from '@dua-upd/blob-storage';
import { duckDbTable } from './duckdb.table';

export type DuckDBClientOptions = {
  readOnly?: boolean;
  logger?: boolean;
};

export const htmlSnapshotTable = pgTable('html', {
  url: text('url'),
  page: text('page'), // objectId hex string
  hash: text('hash'),
  html: text('html'),
  date: timestamp('date'),
});

export type HtmlSnapshot = typeof htmlSnapshotTable.$inferSelect;

@Injectable()
export class DuckDbService implements BeforeApplicationShutdown {
  readonly isReadOnly: boolean = !!this.options?.readOnly;

  readonly remote = {
    html: duckDbTable(this.db, this.blob, {
      name: 'html',
      remoteContainer: 'html-snapshots',
      remoteContainerPath: 'hashes-html.parquet',
      tableCreationSql: `
          CREATE TABLE IF NOT EXISTS html (
            url TEXT,
            page TEXT,
            hash TEXT,
            html TEXT,
            date TIMESTAMP
          )`,
      table: htmlSnapshotTable,
    }),
  } as const;

  private constructor(
    private client: Database,
    private _db: DuckDBDatabase,
    @Inject(BlobStorageService.name) private blob: BlobStorageService,
    private options?: DuckDBClientOptions,
  ) {}

  get db() {
    return this._db;
  }

  static async create(
    connectionString: string | ':memory:' = ':memory:',
    blob: BlobStorageService,
    options?: DuckDBClientOptions,
  ) {
    const client = await Database.create(
      connectionString,
      options?.readOnly ? OPEN_READONLY : OPEN_READWRITE,
    );

    const duckDb = drizzle(client, { logger: options?.logger ?? false });

    return new DuckDbService(client, duckDb, blob, options);
  }

  async setupRemoteAuth() {
    return await this.db.execute(`
      CREATE SECRET blob_storage (
          TYPE azure,
          CONNECTION_STRING '${process.env['AZURE_STORAGE_CONNECTION_STRING']}'
      );  
    `);
  }

  async disconnect() {
    await this.client.close();
  }

  async beforeApplicationShutdown() {
    return await this.client.close();
  }
}
