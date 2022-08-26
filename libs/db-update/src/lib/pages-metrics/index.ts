import dayjs from 'dayjs';
import {
  AdobeAnalyticsClient,
  DateRange,
  queryDateFormat,
  SearchAnalyticsClient,
  singleDatesFromDateRange,
} from '@dua-upd/external-data';
import {
  getDbConnectionString,
  PageMetrics,
  getPageMetricsModel,
  getPageModel,
  Page,
} from '@dua-upd/db';
import { connect, Model, Document, Types } from 'mongoose';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc); // have to use UTC mode or else the output will be off by the timezone offset

export async function fetchAndMergePageMetrics(dateRange: DateRange) {
  const adobeAnalyticsClient = new AdobeAnalyticsClient();
  const gscClient = new SearchAnalyticsClient();

  const [aaResults, gscResults] = await Promise.all([
    adobeAnalyticsClient.getPageMetrics(dateRange, {
      // temporary fix for pages longer than 255 characters
      search: {
        clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
      },
    }),
    gscClient.getPageMetrics(dateRange, { dataState: 'all' }),
  ]);

  // because there'll be potentially tens of thousands of results,
  //   we'll chunk them by date to merge them more efficiently
  const aaDates = aaResults.map((dateResults) => dateResults[0]?.date);
  const gscDates = gscResults.map((dateResults) => dateResults[0]?.date);

  if (aaDates.length !== gscDates.length) {
    console.error(
      'Mismatched dates between Adobe Analytics and Google Search Console'
    );
  }

  return aaDates
    .map((date) => {
      const aaDateResults = aaResults.find(
        (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
      );
      const gscDateResults =
        gscResults.find(
          (dateResults) => dateResults[0]?.date.getTime() === date.getTime()
        ) || [];

      return aaDateResults.map((aaDateResults) => {
        const gscResults = gscDateResults.find(
          (gscDateResult) => gscDateResult.url === aaDateResults.url
        );

        return {
          _id: new Types.ObjectId(),
          ...aaDateResults,
          ...(gscResults || {}),
        };
      });
    })
    .flat();
}

export async function updatePageMetrics() {
  await connect(getDbConnectionString());

  // Our Mongoose model, which lets us query the "pages_metrics" collection
  const pageMetricsModel: Model<Document<PageMetrics>> =
    await getPageMetricsModel();

  // get dates required for query
  const latestDateResults = await pageMetricsModel
    .findOne({}, { date: 1 })
    .sort({ date: -1 });

  // get the most recent date from the DB, and set the start date to the next day
  const latestDate = dayjs.utc(latestDateResults['date']);
  const startTime = latestDate.add(1, 'day');

  // collect data up to the start of the current day/end of the previous day
  const cutoffDate = dayjs.utc().startOf('day');

  // fetch data if our db isn't up-to-date
  if (startTime.isBefore(cutoffDate)) {
    const fullDateRange = {
      start: startTime.format(queryDateFormat),
      end: cutoffDate.format(queryDateFormat),
    };

    // to be able to iterate over each day
    const dateRanges = singleDatesFromDateRange(fullDateRange, queryDateFormat).map(
      (date) => ({
        start: date,
        end: dayjs(date).add(1, 'day').format(queryDateFormat),
      })
    );

    for (const dateRange of dateRanges) {
      console.log(
        `\r\nFetching page metrics from AA & GSC for date: ${dateRange.start}\r\n`
      );

      const newPageMetrics = await fetchAndMergePageMetrics(dateRange);

      await pageMetricsModel.insertMany(newPageMetrics, { lean: true });

      console.log(
        `Successfully inserted page metrics data for: ${dateRange.start}`
      );
    }

    return await Promise.resolve();
  } else {
    console.log('Page metrics already up-to-date.');
  }
}

// For merging AA page metrics data with pre-existing GSC data, or inserting if no match is found
async function upsertAAPageMetrics(pageMetrics: PageMetrics[]) {
  const pageMetricsModel = getPageMetricsModel();

  return await pageMetricsModel.bulkWrite(
    pageMetrics.map((metrics) => ({
      updateOne: {
        filter: { url: metrics.url, date: metrics.date },
        update: { $set: metrics },
        upsert: true,
      },
    }))
  );
}

export async function addAAPageMetrics(dateRange: DateRange) {
  await connect(getDbConnectionString());

  const adobeAnalyticsClient = new AdobeAnalyticsClient();

  return await adobeAnalyticsClient.getPageMetrics(dateRange, {
    postProcess: upsertAAPageMetrics,
    search: {
      clause: `BEGINS-WITH 'www.canada.ca' AND (BEGINS-WITH 'www.canada.ca/en/revenue-agency'\
        OR BEGINS-WITH 'www.canada.ca/fr/agence-revenu' OR BEGINS-WITH 'www.canada.ca/fr/services/impots'\
        OR BEGINS-WITH 'www.canada.ca/en/services/taxes')`,
    },
  });
}

export async function addRefsToPageMetrics() {
  await connect(getDbConnectionString());
  console.log('Adding references to Page Metrics');

  const pageModel = getPageModel();

  // First check if there are any pages that share urls. If that's the case we can't associate to a specific Page
  for (const page of (await pageModel.find({}, { all_urls: 1 })) as Page[]) {
    const pagesWithCommonUrls = await pageModel.find(
      {
        _id: { $ne: page._id },
        all_urls: {
          $elemMatch: { $in: page.all_urls },
        },
      },
      { _id: 1 }
    );

    if (pagesWithCommonUrls.length > 0) {
      throw new Error(
        `Found pages with duplicated URLs- Cannot add references:\r\n ${JSON.stringify(
          pagesWithCommonUrls,
          null,
          2
        )}`
      );
    }
  }
  const pageMetricsModel = getPageMetricsModel();

  // We can only associate metrics with pages from airtable if we want to map them to tasks/tests/projects
  // -> Iterate through pages w/ airtable_id and add refs to metric docs w/ url in all_urls
  const pages = (await pageModel.find({
    airtable_id: { $exists: true },
  })) as Page[];

  const bulkWriteOps = pages.map((page) => ({
    updateMany: {
      filter: { url: { $in: page.all_urls } },
      update: {
        $set: {
          page: page._id,
          tasks: page.tasks,
          projects: page.projects,
          ux_tests: page.ux_tests,
        },
      },
    },
  }));
  const airtablePageResults = await pageMetricsModel.bulkWrite(bulkWriteOps);

  console.log(airtablePageResults);

  // Now for metrics that don't have refs, add a page ref if it's in the page's all_urls
  const metricsUrls = await pageMetricsModel
    .distinct('url', { page: { $exists: false } })
    .exec();

  const nonAirtableBulkWriteOps = [];

  while (metricsUrls.length !== 0) {
    const batch = metricsUrls.splice(0, 1000);

    const batchMatches = await pageModel.find({
      all_urls: { $elemMatch: { $in: batch } },
    });

    if (batchMatches.length === 0) {
      continue;
    }

    for (const url of batch) {
      const matchingPage = (await pageModel
        .findOne(
          {
            all_urls: {
              $elemMatch: { $eq: url },
            },
          },
          { _id: 1, url: 1 }
        )
        .lean()) as Page;

      if (matchingPage) {
        nonAirtableBulkWriteOps.push({
          updateMany: {
            filter: { url },
            update: {
              $set: {
                page: matchingPage._id,
              },
            },
          },
        });
      }
    }
  }

  const results = await pageMetricsModel.bulkWrite(nonAirtableBulkWriteOps);

  console.log(results);
  console.log('Successfully added references to Page Metrics');
}
