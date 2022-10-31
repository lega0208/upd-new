import { connect, Types } from 'mongoose';
import {
  SearchAssessment,
  getSearchAssessmentModel,
  getDbConnectionString,
} from '@dua-upd/db';
import { Inject, Injectable } from '@nestjs/common';
import {
  AdobeAnalyticsClient,
  toQueryFormat,
  queryDateFormat,
} from '../lib/adobe-analytics';
import { AirtableClient, DateType } from '../lib/airtable';
import {
  CreatedFieldRecord,
  FieldRecord,
  FieldRecordQuery,
  lang,
} from '../lib/airtable/query';

import { HttpClient, squishTrim } from '@dua-upd/utils-common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import cheerio from 'cheerio';

dayjs.extend(utc);

type AARecord = {
  data: AARecordQuery[];
  date: string;
  itemid_phrase: string;
  phrase: string;
  visits: number;
}[];

type AARecordQuery = {
  link: string;
  rank: number;
};

@Injectable()
export class SearchAssessmentService {
  constructor(
    @Inject(AirtableClient.name) private airtableClient: AirtableClient,
    @Inject(AdobeAnalyticsClient.name)
    private adobeAnalyticsClient: AdobeAnalyticsClient
  ) {}

  // dateRange = {
  //   start: toQueryFormat(
  //     dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  //   ),
  //   end: toQueryFormat(dayjs().startOf('month').format('YYYY-MM-DD')),
  // };

  dateRange = {
    start: toQueryFormat(
      dayjs.utc('2020-01-01').startOf('week').format('YYYY-MM-DD')
    ),
    end: toQueryFormat(
      dayjs()
        .subtract(1, 'week')
        .endOf('week')
        .add(1, 'day')
        .format('YYYY-MM-DD')
    ),
  };

  craEn = 'https://www.canada.ca/en/revenue-agency/search.html';
  craFr = 'https://www.canada.ca/fr/agence-revenu/rechercher.html';

  searchAssessmentModel = getSearchAssessmentModel();

  // client = new SMTPClient({
  //   host: process.env.EMAIL_HOST,
  //   user: process.env.EMAIL_USER,
  //   password: process.env.EMAIL_PASSWORD,
  //   ssl: true,
  // });

  // async email() {
  //   try {
  //     const message = await this.client.sendAsync({
  //       text: 'i hope this works',
  //       from: 'Adam Monsour <adam.monsour@gmail.com>',
  //       to: 'Adam Monsour <adam.monsour@gmail.com>',
  //       subject: 'testing emailjs',
  //       body: 'testing emailjs',
  //     });
  //     console.log(message);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  async updateSearchAssessmentData(lang: lang = 'en') {
    await connect(getDbConnectionString());

    console.log(this.dateRange);
    // get dates required for query
    let latestDateResults = await this.searchAssessmentModel
      .find({}, { date: 1 })
      .sort({ date: -1 })
      .limit(1)
      .exec();

    //console.log(latestDateResults[0]['date']);

    let latestDate = dayjs.utc(latestDateResults[0]?.['date'] || '2021-09-05');
    // // get the most recent date from the DB, and set the start date to the next day

    let startTime = latestDate.add(1, 'week').startOf('week');
    let endTime = latestDate
      .add(1, 'week')
      .endOf('week')
      .add(1, 'day')
      .startOf('day');

    // // // collect data up to the start of the current day/end of the previous day
    const cutoffDate = dayjs.utc().subtract(1, 'day').endOf('day');

    //     const dateRange = {
    //   start: startTime.format(queryDateFormat),
    //   end: endTime.format(queryDateFormat),
    // };

    // console.log(dateRange)
    // console.log(cutoffDate)

    // // fetch data if our db isn't up-to-date
    while (startTime.isBefore(cutoffDate)) {
      const dateRange = {
        start: startTime.format(queryDateFormat),
        end: endTime.format(queryDateFormat),
      };

      console.log(dateRange);

      await this.deleteSearchAssessment(lang);
      await this.insertCurrent(lang, dateRange);
      await this.updateSearchResultsUsingAA(lang, dateRange);
      await this.archiveSearchAssessmentData(lang);

      latestDateResults = await this.searchAssessmentModel
        .find({}, { date: 1 })
        .sort({ date: -1 })
        .limit(1)
        .exec();

      //console.log(latestDateResults[0]['date']);

      latestDate = dayjs.utc(latestDateResults[0]?.['date'] || '2021-09-05');
      // // get the most recent date from the DB, and set the start date to the next day

      startTime = latestDate.add(1, 'week').startOf('week');
      endTime = latestDate
        .add(1, 'week')
        .endOf('week')
        .add(1, 'day')
        .startOf('day');
    }

    return;
  }

  async archiveSearchAssessmentData(lang: lang = 'en') {
    console.log('Updating Search Assessment data');
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
        } as SearchAssessment)
    );

    if (searchAssessmentData.length === 0) {
      console.log('Search Assessment data is already archived.');
      return;
    }

    return await this.searchAssessmentModel
      .insertMany(searchAssessmentData)
      .then(() => console.log('Successfully updated Search Assessment data'));
  }

  async deleteSearchAssessment(lang: lang = 'en') {
    const ids: string[] = [];

    const records = await this.getCurrentSearchAssessment(lang);

    records.forEach((d) => {
      ids.push(d.id);
    });

    console.log('Removed: ', ids.length, ' airtable records');
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
            Visits: d.visits,
          },
        } as CreatedFieldRecord;
      })
      .sort((a, b) => b.fields.Visits - a.fields.Visits);
  }

  async insertCurrentSearchAssessment(data: CreatedFieldRecord[], lang) {
    return await this.airtableClient.insertSearchAssessment(data, lang);
  }

  async insertCurrent(lang: lang = 'en', dateRange) {
    const itemids: string[] = [];

    const searchPhrasesResults = await this.getAAPhraseItemIds(lang, dateRange);
    searchPhrasesResults.forEach((d) => {
      itemids.push(d.itemid_phrase);
    });

    const results = (
      await this.getAAPhrase(itemids, searchPhrasesResults, lang, dateRange)
    )
      .sort((a, b) => b.visits - a.visits)
      .map((d, i) => {
        return {
          fields: {
            Query: d.phrase,
            '1st Result': d.data[0]?.link || '',
            '1st Position': d.data[0]?.rank || 0,
            '2nd Result': d.data[1]?.link || '',
            '2nd Position': d.data[1]?.rank || 0,
            '3rd Result': d.data[2]?.link || '',
            '3rd Position': d.data[2]?.rank || 0,
            '4th Result': d.data[3]?.link || '',
            '4th Position': d.data[3]?.rank || 0,
            '5th Result': d.data[4]?.link || '',
            '5th Position': d.data[4]?.rank || 0,
            Date: dayjs(d.date).utc(false).format('YYYY-MM-DD'),
            Visits: d.visits,
            Rank: i + 1,
          },
        } as CreatedFieldRecord;
      });

    console.log('Inserted: ', results.length, ' airtable records');

    await this.insertCurrentSearchAssessment(results, lang);

    return searchPhrasesResults;
  }

  async getAAPhraseItemIds(lang: lang = 'en', dateRange) {
    return await this.adobeAnalyticsClient.getPhraseItemIds(dateRange, lang);
  }

  async getAAPhrase(
    itemids: string[],
    searchPhrasesResults,
    lang: lang = 'en',
    dateRange
  ) {
    return (
      await this.adobeAnalyticsClient.getPhrase(dateRange, itemids, lang)
    ).map((result) => {
      const result2 = searchPhrasesResults.find(
        (r) => r.itemid_phrase === result.itemid_phrase
      );
      return {
        ...result2,
        ...result,
      };
    }) as AARecord;
  }

  async fetchSearchResults(lang: lang) {
    const site = lang === 'en' ? this.craEn : this.craFr;
    const queries = (await this.getCurrentSearchAssessment(lang)).map((d) => {
      return {
        id: d.id,
        query: d.fields.Query,
        expected: d.fields['Expected Result'],
        expectedRank: d.fields['Expected Position'],
        rank: 0,
      };
    });

    const httpClient = new HttpClient();

    try {
      for (const [i, query] of queries.entries()) {
        const searchResults = await httpClient.get(
          `${site}?q=${encodeURIComponent(squishTrim(query.query))}`
        );

        const $ = cheerio.load(searchResults);
        $('section h3 > a').each(function (idx) {
          const href = $(this).attr('href');
          if (href === query.expected) {
            queries[i].rank = idx + 1;
            console.log(
              `Found ranked ${idx + 1} for ${query.query} : ${
                query.expectedRank
              }`
            );
            return;
          }
        });
      }
    } catch (err) {
      console.log(err);
    }

    return queries;
  }

  async updateSearchResults(lang: lang = 'en') {
    await this.getExpectedURLFromDB(lang);

    const results = await (
      await this.fetchSearchResults(lang)
    ).map((d) => {
      return {
        id: d.id,
        fields: {
          Query: d.query,
          'Expected Position': d.rank,
          Pass: d.rank <= 3 && d.rank > 0 ? true : false,
        },
      };
    });

    return await this.airtableClient.updateSearchAssessment(results, lang);
  }

  async updateSearchResultsUsingAA(lang: lang = 'en', dateRange) {
    const itemids: string[] = [];

    const searchPhrasesResults = await this.getAAPhraseItemIds(lang, dateRange);
    searchPhrasesResults.forEach((d) => {
      itemids.push(d.itemid_phrase);
    });

    const results = await this.getAAPhrase(
      itemids,
      searchPhrasesResults,
      lang,
      dateRange
    );
    const data = await this.getExpectedURLFromDB(lang);

    const data2 = data.map((d) => {
      const result = results.find((r) => r.phrase === d.fields.Query);
      let rank = Number(
        result?.data.find((r) => r.link === d.fields['Expected Result'])?.rank
      );
      rank = isFinite(rank) ? rank : 0;
      const pass = rank <= 3 && rank > 0 ? true : false;
      return {
        ...d,
        fields: {
          ...d.fields,
          'Expected Result': d.fields['Expected Result'],
          'Expected Position': rank,
          Pass: pass,
        },
      };
    });

    console.log('Updated: ', data2.length, ' airtable records');
    return await this.airtableClient.updateSearchAssessment(data2, lang);
  }

  async getExpectedResults(lang: lang = 'en') {
    return (await this.airtableClient.getSearchAssessment('Expected DB')).map(
      (d) => {
        return {
          fields: {
            Id: d.airtable_id,
            Query: d.query,
            URL: d.url,
          },
        };
      }
    );
  }

  async getExpectedURLFromDB(query: string, lang: lang = 'en') {
    const expectedResults = await this.getExpectedResults(lang);
    const currentResults = await this.getCurrentSearchAssessment(lang);

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

    const res = currentResults
      .map((d) => {
        const result = expectedResultsDelimited.find(
          (r) =>
            squishTrim(r.fields.Query.toLowerCase()) ===
            squishTrim(d.fields.Query.toLowerCase())
        );
        if (result) {
          return {
            id: d.id,
            fields: {
              Query: d.fields.Query,
              'Expected Result': result.fields.URL,
            },
          };
        }
      })
      .flatMap((f) => (f ? [f] : []));

    await this.airtableClient.updateSearchAssessment(res, lang);

    return res;
  }
}
