import axios from 'axios';
import dayjs from 'dayjs';
import cheerio from 'cheerio';
import { connect, Model, Document, Types } from 'mongoose';
import { getPageModel, Page, getDbConnectionString } from '@cra-arc/db';

// todo: implement this rather than the more specific functions below?
//        will probably want to rethink how to do all this
export async function* checkUrlsWithRateLimit(
  func: (url: string) => Promise<unknown>,
  urls: string[],
  batchSize: number,
  delay: number
) {
  while (urls.length > 0) {
    const batch = urls.splice(0, batchSize);

    const promises = batch.map((url) => func(url));

    const responses = await Promise.allSettled(promises);

    const http403Errors = responses.filter(
      (response) =>
        response.status === 'rejected' &&
        response.reason.response.status === 403
    );

    yield responses;

    if (http403Errors.length > 0) {
      delay = delay * 2;
      console.log(
        `[checkUrls] - Rate limit exceeded, delay increased to ${delay}ms`
      );
      // wait the new delay twice if rate limit is exceeded
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function* getRedirectsWithRateLimit(
  urls: string[],
  batchSize: number,
  delay: number
) {
  const redirectHttpCodes = [301, 302, 307, 308];

  urls = urls.map((url) => `https://${url}`);

  while (urls.length > 0) {
    const batch = urls.splice(0, batchSize);

    const promises = batch.map((url) =>
      axios.get(url, {
        maxRedirects: 5,
        responseType: 'json',
      })
    );

    try {
      const responses = await Promise.allSettled(promises);

      // check for rate-limiting
      const http403Errors = responses.filter(
        (response) =>
          response.status === 'rejected' &&
          response.reason.response?.status === 403
      );

      const redirects = responses
        .filter((response) => {
          const promiseFulfilled = response.status === 'fulfilled';
          const isRedirect = response['value']?.request?._redirectable?._isRedirect;

          return promiseFulfilled && isRedirect;
        })
        .map((response) => response['value'])
        .reduce((redirects, response) => {
          // todo: get list of all redirects instead of just final url
          redirects[response.config.url.replace('https://', '')] = (
            response.request._redirectable?._currentUrl ||
            response.headers.location
          ).replace('https://', '');

          return redirects;
        }, {} as Record<string, string>);

      if (Object.keys(redirects).length > 0) {
        yield redirects;
      }

      if (http403Errors.length > 0) {
        delay = delay * 2;
        console.log(
          `[getRedirects] - Rate limit exceeded, delay increased to ${delay}ms`
        );
        // wait the new delay twice if rate limit is exceeded
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (e) {
      if (e.response) {
        // The request was made and the server responded with a status code
        // console.log(e.response.data);
        console.error(e.response.status);
        console.error(e.response.headers);
      } else if (e.request) {
        // The request was made but no response was received
        console.error(e.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error: ', e.message);
        console.error(e.stack);
      }
      console.error(e.config);
      console.error(`Batch: ${batch}`);
    }
  }
}

export async function updatePageUrls(
  pages: Page[],
  pagesModel: Model<Document<Page>>
) {
  const pageUrls = pages.map((page) => page['url']);
  const updateOps = [];

  const redirectsIterator = getRedirectsWithRateLimit(pageUrls, 25, 251);

  // outer for loop is for batches
  for await (const redirects of redirectsIterator) {
    const pagesToUpdate = await pagesModel
      .find({ url: { $in: Object.keys(redirects) } }, { _id: 1, url: 1 })
      .lean();

    for (const page of pagesToUpdate) {
      const newUrl = redirects[page['url']];

      console.log(
        `[updatePageUrls] - Updating url: \r\n${page['url']} \r\nto: \r\n${newUrl}`
      );

      updateOps.push({
        updateOne: {
          filter: { _id: page['_id'] },
          update: {
            $currentDate: { lastChecked: true, lastModified: true },
            $set: { url: newUrl },
            $addToSet: { all_urls: { $each: [page['url'], newUrl] } },
          },
        },
      });
    }
  }

  if (updateOps.length > 0) {
    return await pagesModel.bulkWrite(updateOps);
  }
}

// todo: make more general generator like this that can be used for both
export async function* getPageTitlesWithRateLimit(
  pages: Page[],
  batchSize: number,
  delay: number
) {
  while (pages.length > 0) {
    const batch = pages.splice(0, batchSize);

    const promises = batch.map((page) =>
      axios
        .get(`https://${page['url']}`, { responseType: 'document' })
        .then((response) => {
          const $ = cheerio.load(response.data);
          const title = $('title').text().replace(' - Canada.ca', '');

          return {
            _id: page._id,
            url: page.url,
            title,
          };
        })
    );

    const results = await Promise.allSettled(promises);

    const http403Errors = results.filter(
      (response) =>
        response.status === 'rejected' &&
        response.reason.response?.status === 403
    );

    const titles = results
      .filter((response) => response.status === 'fulfilled')
      .map((response) => response['value']);

    if (Object.keys(titles).length > 0) {
      yield titles;
    }

    if (http403Errors.length > 0) {
      delay = delay * 2;
      console.log(
        `[getRedirects] - Rate limit exceeded, delay increased to ${delay}ms`
      );
      // wait the new delay twice if rate limit is exceeded
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function updatePageTitles(
  pages: Page[],
  pagesModel: Model<Document<Page>>
) {
  const pageTitlesIterator = getPageTitlesWithRateLimit([...pages], 25, 251);
  const updateOps = [];

  // outer for loop is for batches
  for await (const titles of pageTitlesIterator) {
    for (const title of titles) {
      const filteredPages = pages.filter((page) => title['_id'] === page._id);

      const currentTitle = filteredPages[0]['title'];

      if (currentTitle !== title['title'].trim()) {
        console.log(
          `[updatePageTitles] - Updating page title for ${title['url']}:`
        );
        console.log(`[updatePageTitles] - ${currentTitle} - Current`);
        console.log(`[updatePageTitles] - ${title['title']} - New`);

        updateOps.push({
          updateOne: {
            filter: { _id: new Types.ObjectId(title['_id']) },
            update: {
              $currentDate: { lastChecked: true, lastModified: true },
              $set: { title: title['title'].trim() },
            },
          },
        });
      }
    }
  }

  if (updateOps.length > 0) {
    return await pagesModel.bulkWrite(updateOps);
  }
}

export async function updatePages() {
  await connect(getDbConnectionString());
  console.log('Updating page titles and urls');
  // Our Mongoose model, which lets us query the "pages" collection
  const pagesModel: Model<Document<Page>> = getPageModel();

  const twoDaysAgo = dayjs().subtract(2, 'days').toDate();

  const pages = (await pagesModel
    .find({
      // find pages that have not been checked in the last two days, or that have never been updated
      $or: [
        { lastChecked: { $lte: twoDaysAgo } },
        { lastChecked: { $exists: false } },
      ],
    })
    .lean()) as Page[];

  await updatePageUrls(pages, pagesModel);
  await updatePageTitles(pages, pagesModel);

  // update lastChecked for all pages
  const pageIds = pages.map((page) => page['_id']);
  await pagesModel.updateMany(
    { _id: { $in: pageIds } },
    {
      $currentDate: { lastChecked: true },
    }
  );

  console.log('Finished updating page titles and urls.');
}

export async function getUrlRedirectAndPageTitle(url: string) {
  try {
    return await axios.get(`https://${url}`).then((response) => {
      const isRedirect = response.request._redirectable?._isRedirect;
      const responseUrl = response.request._redirectable?._currentUrl.replace(
        'https://',
        ''
      );
      const title = (/(?<=<title>).+(?=<\/title>)/.exec(response.data) || [
        '',
      ])[0]
        .replace(/\s+(-|&nbsp;)\s+Canada\.ca/i, '')
        .trim();

      return {
        isRedirect,
        responseUrl,
        title,
      };
    });
  } catch (e) {
    if (e.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(
        `Error status code received from HTTP request to ${url}: ${e.response.status}`
      );

      return { status: e.response.status };
    } else if (e.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(e.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', e.message);
    }
    console.error('Error: ', e);
  }
}
