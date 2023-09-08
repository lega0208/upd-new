import { DbModule, DbService } from '@dua-upd/db';
import { arrayToDictionary } from '@dua-upd/utils-common';
import { DbUpdateModule } from '../db-update.module';
import { Test, TestingModule } from '@nestjs/testing';
import { AirtableService } from './airtable.service';
import { UxData } from './types';
import { mockData } from './mock.data';

jest.setTimeout(60000);

describe('AirtableService', () => {
  let service: AirtableService;
  let module: TestingModule;
  let uxData: UxData;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DbUpdateModule.register(false), DbModule.forRoot(false)],
    }).compile();

    service = module.get<AirtableService>(AirtableService);

    // uxData = await readFile('airtable_ux-data.json', 'utf8').then(JSON.parse);
    uxData = mockData;
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', async () => {
    // const results = await service.getAndPrepareUxData();
    //
    // await writeFile('airtable_ux-data.json', prettyJson(results), 'utf8');

    expect(service).toBeDefined();
  });

  it('should determine whether or not pages have changed', async () => {
    const { pages } = uxData;

    const pagesModel = (await module.get(DbService)).collections.pages;

    const currentPages =
      (await pagesModel
        .find({
          $or: [
            { airtable_id: { $exists: true } },
            { 'tasks.0': { $exists: true } },
            { 'projects.0': { $exists: true } },
          ],
        })
        .lean()
        .exec()) || [];

    const pagesDict = arrayToDictionary(pages, '_id', true);

    const changed = await service.pagesHaveChanged(
      currentPages,
      pagesDict,
      pages
    );

    console.log('changed: ', changed);

    expect(changed).toBe(true);
  });
});
