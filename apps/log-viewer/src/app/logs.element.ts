import { BlobItem, ContainerClient } from '@azure/storage-blob';
import { type RegisteredBlobModel } from '@dua-upd/blob-storage';
import dayjs from 'dayjs';

const containerClient = new ContainerClient(
  import.meta.env.VITE_AZURE_STORAGE_SAS,
  'logs'
);

async function mapBlobs<T>(
  mapFunc: (item: BlobItem) => T,
  prefix?: RegisteredBlobModel
) {
  const returnVals: T[] = [];

  for await (const blobInfo of containerClient.listBlobsFlat(
    prefix && { prefix }
  )) {
    const mappedVal = await mapFunc(blobInfo);

    returnVals.push(mappedVal);
  }

  return returnVals;
}

type Logs = {
  date: Date;
  errors: string;
  info: string;
};

type LogsByDate = {
  [date: string]: Logs;
};

const formatDate = (date: Date) => dayjs(date).format('MMMM DD YYYY');

export class LogsElement extends HTMLElement {
  public static observedAttributes = [];

  logs?: Logs[];
  mostRecentDate?: Date;
  mostRecentStatus?:
    | '<span class="success">✅ Successful</span>'
    | '<span class="error">❌ Error</span>';
  mostRecentError?: Date | null;

  async fetchLogs() {
    const logsByDate: LogsByDate = {};

    const promises = await mapBlobs(async (logFile) => {
      const date = new Date(
        logFile.name.slice(logFile.name.length - 10, logFile.name.length) +
          ' EST'
      );
      const isError = /error/.test(logFile.name);

      if (!logsByDate[date.toISOString()]) {
        logsByDate[date.toISOString()] = { date, errors: '', info: '' };
      }

      return (
        await containerClient
          .getBlobClient(logFile.name)
          .download(0, undefined, {})
      ).blobBody?.then(async (buffer) => {
        const logs = await buffer.text();

        if (isError) {
          logsByDate[date.toISOString()].errors += `\n${logs}`;
        } else {
          logsByDate[date.toISOString()].info += `\n${logs}`;
        }
      });
    });

    await Promise.all(promises);

    this.logs = Object.values(logsByDate).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }

  async connectedCallback() {
    await this.fetchLogs();

    this.mostRecentDate = this.logs?.[0]?.date;
    this.mostRecentStatus = this.logs?.[0]?.errors
      ? '<span class="error">❌ Error</span>'
      : '<span class="success">✅ Successful</span>';
    this.mostRecentError =
      this.mostRecentStatus !== '<span class="error">❌ Error</span>'
        ? this.logs?.find((log) => log.errors)?.date
        : null;

    const logs = this.logs
      ?.map(
        (log) => `
    <div class="card ${log.errors ? 'error' : 'success'} shadow">
    ${
      log.errors
        ? `<h2 class="error">❌ ${formatDate(log.date)}</h2>`
        : `<h2 class="success">✅ ${formatDate(log.date)}</h2>`
    }
        ${
          (log.errors || '') &&
          `
      <details class="details">
        <summary class="error">
          <h3>Errors</h3>
        </summary>
        <pre>${log.errors}</pre>
      </details>`
        }
        ${
          (log.info || '') &&
          `
      <details class="details">
        <summary class="success">
          <h3>Info</h3>
        </summary>
        <pre>${log.info}</pre>
      </details>`
        }
    </div>`
      )
      .join('');

    const statusHtml = this.logs?.length
      ? `
        <div id="hero" class="rounded">
          <div class="text-container status">
            <h2>Most recent updates:</h2>
            <h3>Date: ${formatDate(this.mostRecentDate as Date)}</h3>
            <h3>Status: ${this.mostRecentStatus}</h3>
            ${
              this.mostRecentError
                ? `<hr/><h3>Most recent error: ${formatDate(
                    this.mostRecentError
                  )}</h3>`
                : ''
            }
          </div>
        </div>
    `
      : '';

    this.innerHTML = `
    <div class="wrapper">
      <div class="container">
        ${statusHtml}
        <div id="commands" class="rounded">
          ${logs ? logs : 'No logs found'}
        </div>
      </div>
    </div>
      `;
  }
}
customElements.define('dua-upd-logs', LogsElement);
