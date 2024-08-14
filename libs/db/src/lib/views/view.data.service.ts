import { Mutex } from '@dua-upd/utils-common';
import { DbViewNew } from '../db.views.new';
import { DateRange } from '@dua-upd/types-common';

type DateRangeManager = {
  lastKnownRefresh: Date | null;
  // Mutex to avoid race conditions from concurrent access
  mutex: Mutex;
};

export class ViewDataService {
  private readonly dateRangeManagers = new Map<string, DateRangeManager>();

  // "Global" mutex to avoid race conditions from concurrent access
  private readonly mutex = new Mutex();

  constructor(private view: DbViewNew<any, any, any>) {}

  private async getDateRangeManager(dateRange: DateRange<Date>) {
    await this.mutex.lock();

    try {
      const dateRangeString = dateRangeToString(dateRange);

      if (!this.dateRangeManagers.has(dateRangeString)) {
        this.registerDateRange(dateRange);
      }

      return this.dateRangeManagers.get(dateRangeString);
    } finally {
      this.mutex.unlock();
      // console.log('ViewDataService global mutex unlocked');
      // this.mutex.logTotalLockTime();
    }
  }

  async ensureData(dateRange: DateRange<Date>) {
    const dateRangeManager = await this.getDateRangeManager(dateRange);

    try {
      await dateRangeManager.mutex.lock();

      // Happy path where we have a last known refresh time in memory, and it's not past expiry
      if (
        dateRangeManager.lastKnownRefresh &&
        !this.view.isPastExpiry(dateRangeManager.lastKnownRefresh)
      ) {
        return;
      }

      // Check the DB for last refresh time
      const lastRefresh = await this.view.getLastUpdated(dateRange);

      dateRangeManager.lastKnownRefresh = lastRefresh;

      const isExpired = this.view.isPastExpiry(lastRefresh);

      if (!isExpired) {
        return;
      }

      // If it's expired, refresh the data
      await this.view.performRefresh({ dateRange });
    } finally {
      dateRangeManager.mutex.unlock();
      // console.log(
      //   `ViewDataService DateRange mutex unlocked (${dateRangeToString(dateRange)})`,
      // );
      // dateRangeManager.mutex.logTotalLockTime();
    }
  }

  private registerDateRange(dateRange: DateRange<Date>) {
    const dateRangeString = dateRangeToString(dateRange);

    if (!this.dateRangeManagers.has(dateRangeString)) {
      this.dateRangeManagers.set(dateRangeString, {
        lastKnownRefresh: null,
        mutex: new Mutex(),
      });
    }
  }
}

const dateRangeToString = (dateRange: DateRange<Date>) =>
  `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}`;
