import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AdobeAnalyticsClient } from '../lib/adobe-analytics';
import { AirtableClient } from '../lib/airtable';
import { SearchAssessmentService } from './search-assessment.service';
import { AdobeAnalyticsService } from '../lib/adobe-analytics/adobe-analytics.service';
import { Module, ConsoleLogger } from '@nestjs/common';

jest.setTimeout(900000000);

describe('SearchAssessmentService', () => {
  let service: SearchAssessmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: AdobeAnalyticsClient.name,
          useValue: new AdobeAnalyticsClient(),
        },
        {
          provide: AirtableClient.name,
          useValue: new AirtableClient(),
        },
        SearchAssessmentService,
        AdobeAnalyticsService,
        ConsoleLogger,
      ],
      exports: [
        AdobeAnalyticsClient.name,
        AirtableClient.name,
        SearchAssessmentService,
        AdobeAnalyticsService,
        ConsoleLogger,
      ],
    }).compile();

    service = module.get<SearchAssessmentService>(SearchAssessmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // it('should send mail', async () => {
  //   const result = await service.email('en', 6, '2021-01-01');
  //   console.log(result);
  //   expect(result).toBeDefined();
  // });
  // it('should remove', async () => {
  //   const res = await service.archiveSearchAssessmentData();
  //   return expect(res).not.toBeDefined();
  // });

  it('should upsert', async () => {
    const res = await service.upsertPreviousSearchAssessment();
    return expect(res).not.toBeDefined();
  });

  it('should get latest', async () => {
    const res = await service.getLatestSearchAssessment();
    return expect(res).not.toBeDefined();
  });

  // it('should insert current phrases based on AA', async () => {
  //   const res = await service.insertCurrent();
  //   expect(res).not.toBeDefined();
  // });

  // it('should update current phrases based on adobe analytics', async () => {
  //   const res = await service.updateSearchResultsUsingAA();
  //   expect(res).not.toBeDefined();
  // });

  // it('should put into db', async () => {
  //   const res = await service.archiveSearchAssessmentData();
  //   return expect(res).not.toBeDefined();
  // });

  // it('should get ', async () => {
  //   const res = await service.getExpectedResults();
  //   console.log(res);
  //   expect(res).toBeDefined();
  // });

  // it('should insert current phrases based on search results page', async () => {
  //   const res = await service.updateSearchResults();
  //   expect(res).not.toBeDefined();
  // });

  // it('should fetch', async () => {
  //   const res = await service.updateSearchResults('fr');

  //   expect(res).not.toBeDefined();
  // });
});
