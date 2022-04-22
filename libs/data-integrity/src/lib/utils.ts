import { writeFile } from 'fs/promises';

export async function outputCsv(filePath: string, results: Record<string, number | string | Date>[]) {
  if (results.length === 0) {
    console.log(`${filePath} not output -- No results`);
    return;
  }

  const columns = Object.keys(results[0]);

  const csvHeader = `${columns.join(',')}\r\n`;

  const csvBody = results
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
