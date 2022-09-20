import { writeFile } from 'fs/promises';

// "Base URL" regex:
const optionalProtocol = '(?:https?://)?';
const optionalWww = '(?:www\\.)?';
const baseUrl = 'canada\\.ca/';
const lang = '(?:en|fr)/';
const craIdentifier = '(?:revenue-agency|agence-revenu|services/(?:impots|prestations))/';

export const validBaseUrlRegex = new RegExp(
  `^${optionalProtocol}${optionalWww}${baseUrl}${lang}${craIdentifier}`,
  'i'
);

export const invalidBaseUrlRegex = new RegExp(
  `^(?!${optionalProtocol}${optionalWww}${baseUrl}${lang}${craIdentifier})`,
  'i'
);

// Invalid URL characters regex:
const invalidCharactersAndSequences = [
  '\\.pdf$',
  '\\.html.',
  '[%\'"@\\]\\[]',
  'canada.ca/fr/agence-revenu/nouvelles',
  'canada.ca/en/revenue-agency/news',
  '_https_',
  '\\.\\.',
  '^www.canada.ca.+//',
].join('|');

export const invalidCharactersRegex = new RegExp(invalidCharactersAndSequences, 'i');

/**
 * Filters an array of URLs, either keeping only those that are invalid or removing them.
 * @param urls The array of URLs to filter
 * @param keepInvalid Whether to keep only invalid URLs or remove them (default: false)
 */
export function filterInvalidUrls(urls: string[], keepInvalid = false) {
  if (keepInvalid) {
    return urls.filter(
      (url) => !validBaseUrlRegex.test(url) || invalidCharactersRegex.test(url)
    );
  }

  return urls.filter(
    (url) => validBaseUrlRegex.test(url) && !invalidCharactersRegex.test(url)
  );
}

// Exports a csv file from the given array of objects
export async function outputCsv(
  filePath: string,
  data: Record<string, number | string | Date>[]
) {
  if (data.length === 0) {
    console.log(`${filePath} not output -- No results`);
    return;
  }

  const columns = Object.keys(data[0]);

  const csvHeader = `${columns.join(',')}\r\n`;

  const csvBody = data
    .map((row) =>
      columns
        .map((column) => {
          const value = row[column];

          if (value instanceof Date) {
            return value.toISOString();
          }

          return value;
        })
        .join(',')
    )
    .join('\r\n');

  const csv = csvHeader + csvBody;

  await writeFile(filePath, csv);

  console.log(`Wrote data to ${filePath}`);
}
