import { connect, Types } from 'mongoose';
import {
  SearchAssessment,
  getSearchAssessmentModel,
  Overall,
  getOverallModel,
  PageMetrics,
  getPageMetricsModel,
  getDbConnectionString,
} from '@dua-upd/db';
import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import {
  AdobeAnalyticsClient,
  toQueryFormat,
  queryDateFormat,
} from '../lib/adobe-analytics';
import { AdobeAnalyticsService } from '../lib/adobe-analytics/adobe-analytics.service';
import { AirtableClient, DateType } from '../lib/airtable';
import {
  CreatedFieldRecord,
  FieldRecord,
  FieldRecordQuery,
  lang,
} from '../lib/airtable/query';

import { HttpClient, logJson, squishTrim } from '@dua-upd/utils-common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import cheerio from 'cheerio';
import { NotifyClient } from 'notifications-node-client';
import chalk from 'chalk';

dayjs.extend(utc);

type notInList = { term: string; url: string };

@Injectable()
export class SearchAssessmentService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    @Inject(AdobeAnalyticsClient.name)
    private adobeAnalyticsClient: AdobeAnalyticsClient,
    private logger: ConsoleLogger
  ) {}

  craEn = 'https://www.canada.ca/en/revenue-agency/search.html';
  craFr = 'https://www.canada.ca/fr/agence-revenu/rechercher.html';

  searchAssessmentModel = getSearchAssessmentModel();
  overallModel = getOverallModel();
  pageMetricsModel = getPageMetricsModel();

  async email(lang, notInList: notInList[], date: string) {
    const number = `**${notInList.length}**`;
    const notInListString = notInList.map(
      (d) => `**${d.term}** : https://${d.url}\n\r`
    );
    const templateId =
      lang === 'en'
        ? process.env.NOTIFY_TEMPLATE_ID_EN
        : process.env.NOTIFY_TEMPLATE_ID_FR;

    const client = new NotifyClient(
      'https://api.notification.canada.ca',
      process.env.NOTIFY_API_KEY
    );

    const emails = [process.env.NOTIFY_EMAIL, process.env.NOTIFY_EMAIL_2];

    this.logger.log(`Sending email to ${emails.length} recipients for ${lang}...`);

    emails.forEach(async (email) => {
        await client.sendEmail(templateId, email, {
          personalisation: {
            first_name: 'DUA',
            number: number,
            bulleted_list: notInListString,
            date: date,
          },
        });
      });
  }

  async upsertPreviousSearchAssessment() {
    await connect(getDbConnectionString());

    for (const lang of ['en', 'fr'] as ('en' | 'fr')[]) {
      const records = await this.getCurrentSearchAssessment(lang);
      let startDate = dayjs(records[0]?.fields.Date || '2022-11-13').startOf(
        'day'
      );
      // const dbStartQuery = await this.searchAssessmentModel
      //   .find({ lang: lang }, { date: 1 })
      //   .sort({ date: -1 })
      //   .limit(1)
      //   .exec();
      // const dbStartDate = dayjs(dbStartQuery[0]?.date || '2022-11-13').startOf('day');

      // const cutoffDate = dayjs
      //   .utc()
      //   .subtract(2, 'week')
      //   .endOf('week')
      //   .add(1, 'day')
      //   .startOf('day');

      // // checks if the db has the latest record
      // // if it does, and it's after startDate, then set startDate to the latest record

      // if (dbStartDate.isAfter(startDate))
      //   startDate = dbStartDate;
      
      const endDate = dayjs(startDate)
        .add(1, 'week')
        .subtract(1, 'day')
        .startOf('day');

      const dateRangeFilter = {
        date: {
          $gte: new Date(startDate.format('YYYY-MM-DD')),
          $lte: new Date(endDate.format('YYYY-MM-DD')),
        },
      };

      this.logger.log(
        `Updating previous week's search assessment for ${lang} from ${startDate} to ${endDate}`
      );

      let expectedResultsMaster = await this.getExpectedResultsMaster(lang);
      const dbOverallResults = await this.getTopSearchFromOverall(
        lang,
        dateRangeFilter
      );
      const dbRecords = await this.getTopSearchTermPages(
        lang,
        dateRangeFilter,
        dbOverallResults
      );

      let blankExpectedUrlCount = 0;

      records.map((record) => {
        if (!record.fields['Expected Result']) {
          blankExpectedUrlCount++;
        }
      });

      const termsNotInExpectedDB = dbRecords
        .map(({ term, url_positions }) => {
          const result = expectedResultsMaster.find(
            (r) =>
              squishTrim(r.fields.Query.toLowerCase()) ===
              squishTrim(term.toLowerCase())
          );
          const sorted = url_positions.sort((a, b) => a.position - b.position);

          if (!result) {
            return {
              fields: {
                Query: term,
                URL: `https://${sorted[0].url}`,
              },
            };
          }
        })
        .flatMap((f) => (f ? [f] : []))
        .flat();

      if (termsNotInExpectedDB.length > 0 || blankExpectedUrlCount > 0 || records.length === 0) {
        this.logger.log(
          `Found ${termsNotInExpectedDB.length} term(s) not in the Expected DB Master List, or ${blankExpectedUrlCount} blank Expected Result(s)`
        );
        this.logger.log(`Updating the list...`);
        await this.insertExpectedDB(termsNotInExpectedDB, lang);

        expectedResultsMaster = await this.getExpectedResultsMaster(lang);

        const expectedResultsMerged = await this.getExpectedResultsMerged(
          dbRecords,
          expectedResultsMaster
        );

        const notInList: notInList[] = [];

        const airtableInput = dbRecords.map(({ term, url_positions }) => {
          const sorted = url_positions.sort((a, b) => a.position - b.position);
          const expected = expectedResultsMerged.find((r) => r.term === term);
          const foundClicks = dbOverallResults.find((t) => t._id === term);

          if (!expected?.url) {
            notInList.push({
              term,
              url: sorted[0]?.url || '',
            });
          }

          return {
            fields: {
              Query: term,
              'Expected Result': expected?.url || '',
              'Expected Position':
                Math.round(expected?.position as number) || 0,
              Pass:
                expected?.position <= 3 && expected?.position > 0
                  ? true
                  : false,
              '1st Result': sorted[0]?.url || '',
              '1st Position': sorted[0]?.position || 0,
              '2nd Result': sorted[1]?.url || '',
              '2nd Position': sorted[1]?.position || 0,
              '3rd Result': sorted[2]?.url || '',
              '3rd Position': sorted[2]?.position || 0,
              '4th Result': sorted[3]?.url || '',
              '4th Position': sorted[3]?.position || 0,
              '5th Result': sorted[4]?.url || '',
              '5th Position': sorted[4]?.position || 0,
              Clicks: foundClicks?.clicks || 0,
              Date: startDate.format('YYYY-MM-DD'),
            },
          };
        });

        await this.deleteSearchAssessment(lang);
        await this.insertCurrentSearchAssessment(airtableInput, lang);
      }

      this.logger.log(`Upserting previous weeks data...`);
      await this.archiveSearchAssessmentData(lang);
    }
  }

  async getLatestSearchAssessment() {
    await connect(getDbConnectionString());
    
    for (const lang of ['en', 'fr'] as ('en' | 'fr')[]) {
      await this.deleteSearchAssessment(lang);
      const latestDateResults = await this.searchAssessmentModel
        .find({ lang: lang }, { date: 1 })
        .sort({ date: -1 })
        .limit(1)
        .exec();

      const latestDate = dayjs.utc(latestDateResults[0]?.['date']);

      const startDate = latestDate.add(1, 'week').startOf('week');
      const endDate = latestDate.add(1, 'week').endOf('week').startOf('day');

      const cutoffDate = dayjs
        .utc()
        .subtract(2, 'week')
        .endOf('week')
        .add(1, 'day')
        .startOf('day');

      this.logger.log(`Getting latest search assessment for ${lang} from ${startDate} to ${endDate}`);

      const dateRangeFilter = {
        date: {
          $gte: new Date(startDate.format('YYYY-MM-DD')),
          $lte: new Date(endDate.format('YYYY-MM-DD')),
        },
      };

      const notInList: notInList[] = [];

      const dbOverallResults = await this.getTopSearchFromOverall(
        lang,
        dateRangeFilter
      );
      const dbRecords = await this.getTopSearchTermPages(
        lang,
        dateRangeFilter,
        dbOverallResults
      );
      const expectedResultsMaster = await this.getExpectedResultsMaster(lang);
      const expectedResultsMerged = await this.getExpectedResultsMerged(
        dbRecords,
        expectedResultsMaster
      );

      const airtableInput = dbRecords.map(({ term, url_positions }) => {
        const sorted = url_positions.sort((a, b) => a.position - b.position);
        const expected = expectedResultsMerged.find((r) => r.term === term);
        const foundClicks = dbOverallResults.find((t) => t._id === term);

        if (expected?.position === 0 && !expected?.url) {
          notInList.push({
            term,
            url: sorted[0]?.url || '',
          });
        }

        return {
          fields: {
            Query: term,
            'Expected Result': expected?.url || '',
            'Expected Position': Math.round(expected?.position as number) || 0,
            Pass:
              expected?.position <= 3 && expected?.position > 0 ? true : false,
            '1st Result': sorted[0]?.url || '',
            '1st Position': sorted[0]?.position || 0,
            '2nd Result': sorted[1]?.url || '',
            '2nd Position': sorted[1]?.position || 0,
            '3rd Result': sorted[2]?.url || '',
            '3rd Position': sorted[2]?.position || 0,
            '4th Result': sorted[3]?.url || '',
            '4th Position': sorted[3]?.position || 0,
            '5th Result': sorted[4]?.url || '',
            '5th Position': sorted[4]?.position || 0,
            Clicks: foundClicks?.clicks || 0,
            Date: startDate.format('YYYY-MM-DD'),
          },
        };
      });

      await this.airtableClient.insertSearchAssessment(airtableInput, lang);

      if (notInList.length !== 0) {
        this.logger.log(`Found ${notInList.length} terms not in the list for ${lang}; sending email to recipients...`);
        await this.email(
          lang,
          notInList,
          endDate.add(1, 'week').format('YYYY-MM-DD')
        );
      }
    }
  }

  async getExpectedResultsMerged(dbRecords, expectedResults) {
    return dbRecords
      .map((d) => {
        let found = 0;
        const result = expectedResults.find(
          (r) =>
            squishTrim(r.fields.Query.toLowerCase()) ===
            squishTrim(d.term.toLowerCase())
        );

        if (result) {
          const expected = d.url_positions.map((u) => {
            const expectedUrl = result?.fields?.URL;
            const expectedUrlMatch = expectedUrl?.includes(u.url);
            const expectedUrlStartsWithWWW = expectedUrl?.startsWith('www.');

            if (expectedUrlMatch) {
              found = 1;
              return {
                term: d.term,
                url: expectedUrlStartsWithWWW
                  ? `https://${expectedUrl}`
                  : expectedUrl,
                position: u.position,
              };
            }
          });

          if (found === 0) {
            return {
              term: d.term,
              url: result?.fields?.URL,
              position: 0,
            };
          }

          return expected.filter((e) => e !== undefined);
        }

        return {
          term: d.term,
          url: '',
          position: 0,
        };
      })
      .flatMap((f) => (f ? [f] : []))
      .flat();
  }

  async getTopSearchFromOverall(lang, dateRange) {
    await connect(getDbConnectionString());

    const searchTermSelector =
      lang === 'en' ? 'aa_searchterms_en' : 'aa_searchterms_fr';

    const topSearchTermsResults = await this.overallModel
      .aggregate<{ _id: string; clicks: number }>()
      .match(dateRange)
      .project({
        date: 1,
        aa_searchterms_en: 1,
        aa_searchterms_fr: 1,
      })
      .unwind(`${searchTermSelector}`)
      .project({
        date: 1,
        term: {
          $toLower: `$${searchTermSelector}.term`,
        },
        clicks: `$${searchTermSelector}.clicks`,
      })
      // first group terms that were different cases and take the sum of their clicks
      .group({
        _id: {
          date: '$date',
          term: '$term',
        },
        clicks: {
          $sum: '$clicks',
        },
      })
      .group({
        _id: '$_id.term',
        clicks: {
          $sum: '$clicks',
        },
      })
      .sort({ clicks: -1, _id: 1 })
      .limit(100)
      .exec();

    return topSearchTermsResults;
  }

  async getTopSearchTermPages(lang, dateRange, data) {
    const topSearchTerms = data.map((result) => result._id);

    const searchTermsWithUrlPositions = await this.pageMetricsModel
      .aggregate<{
        term: string;
        url_positions: { url: string; position: number }[];
      }>()
      .project({
        date: 1,
        url: 1,
        aa_searchterms: {
          $map: {
            input: '$aa_searchterms',
            as: 'searchterm',
            in: {
              term: {
                $toLower: '$$searchterm.term',
              },
              clicks: '$$searchterm.clicks',
              position: '$$searchterm.position',
            },
          },
        },
      })
      .match({
        ...dateRange,
        url: new RegExp(`^www.canada.ca/${lang}/`),
        'aa_searchterms.term': {
          $in: topSearchTerms,
        },
      })
      .project({
        url: 1,
        aa_searchterms: {
          $filter: {
            input: '$aa_searchterms',
            as: 'searchterm',
            cond: {
              $in: ['$$searchterm.term', topSearchTerms],
            },
          },
        },
      })
      .unwind('aa_searchterms')
      .project({
        term: '$aa_searchterms.term',
        url: 1,
        position: '$aa_searchterms.position',
      })
      .group({
        _id: {
          term: '$term',
          url: '$url',
        },
        position: {
          $avg: '$position',
        },
      })
      .project({
        term: '$_id.term',
        url_position: {
          url: '$_id.url',
          position: '$position',
        },
      })
      .group({
        _id: '$term',
        url_positions: {
          $push: '$url_position',
        },
      })
      .project({ _id: 0, term: '$_id', url_positions: 1 })
      .exec();

    return searchTermsWithUrlPositions;
  }

  async getExpectedResultsMaster(lang) {
    const expectedResults = await this.getExpectedResults(lang);

    const expectedResultsDelimited = expectedResults
      .map((d) => {
        return {
          fields: {
            ...d.fields,
            Query: d.fields.Query.split(', '),
          },
        };
      })
      .map((d) => {
        return d.fields.Query.map((q, i) => {
          return {
            fields: {
              ...d.fields,
              Query: q,
            },
          };
        });
      })
      .flat();

    return expectedResultsDelimited;
  }

  async archiveSearchAssessmentData(lang: lang = 'en') {
    await connect(getDbConnectionString());

    const searchAssessmentData = (
      await this.airtableClient.getSearchAssessment(
        `CRA - ${lang.toUpperCase()}`
      )
    ).map(
      (satData) =>
        ({
          ...satData,
          _id: new Types.ObjectId(),
          lang: lang,
          date: new Date(satData.date),
          pass: satData.pass === undefined ? false : true,
          clicks: satData.clicks,
        } as SearchAssessment)
    );

    if (searchAssessmentData.length === 0)
      return;

    await this.searchAssessmentModel.insertMany(searchAssessmentData)
  }

  async deleteSearchAssessment(lang: lang = 'en') {
    const ids: string[] = [];

    const records = await this.getCurrentSearchAssessment(lang);

    records.forEach((d) => {
      ids.push(d.id);
    });

    return await this.airtableClient.deleteSearchAssessment(ids, lang);
  }

  async getCurrentSearchAssessment(lang: lang) {
    return (
      await this.airtableClient.getSearchAssessment(
        `CRA - ${lang.toUpperCase()}`
      )
    )
      .map((d) => {
        return {
          id: d.airtable_id,
          fields: {
            Query: d.query,
            'Expected Result': d.expected_result,
            'Expected Position': d.expected_position,
            Date: dayjs(d.date).utc(false).format('YYYY-MM-DD'),
            Visits: d.clicks,
          },
        } as CreatedFieldRecord;
      })
      .sort((a, b) => b.fields.Visits - a.fields.Visits);
  }

  async insertCurrentSearchAssessment(data, lang) {
    return await this.airtableClient.insertSearchAssessment(data, lang);
  }

  async insertExpectedDB(data, lang) {
    return await this.airtableClient.insertExpectedDB(
      data,
      `Expected DB - ${lang.toUpperCase()}`,
      lang
    );
  }

  async getExpectedResults(lang: lang = 'en') {
    return (
      await this.airtableClient.getSearchAssessment(
        `Expected DB - ${lang.toUpperCase()}`
      )
    ).map((d) => {
      return {
        fields: {
          Id: d.airtable_id,
          Query: d.query,
          URL: d.url,
        },
      };
    });
  }
}
