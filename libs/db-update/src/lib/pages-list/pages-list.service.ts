import {
  CACHE_MANAGER,
  ConsoleLogger,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PageMetrics, PagesList } from '@dua-upd/db';
import { AirtableService } from '../airtable/airtable.service';
import { logJson } from '@dua-upd/utils-common';

@Injectable()
export class PagesListService {
  private connectionClosed = false;

  constructor(
    private airtableService: AirtableService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private logger: ConsoleLogger
  ) {}

  private async getOrSetCache() {
    const cached = await this.cacheManager.get<
      PagesList[]
      >('pagesList');

    if (cached) {
      return cached;
    }

    try {
      await this.airtableService.updatePagesList();
    } catch (err) {
      this.logger.error('Error getting updated pages list from Airtable');
      this.logger.error(err, err.stack);
    }

    if (this.connectionClosed) {
      return;
    }

    const pagesList = await this.airtableService.getPagesList();

    return await this.cacheManager.set<PagesList[]>('pagesList', pagesList);
  }

  async getPagesList() {
    const pagesList: PagesList[] = await this.getOrSetCache();

    if (!pagesList.length) {
      throw Error('PagesList is empty');
    }

    return pagesList;
  }

  async getPagesListDictionary() {
    const pagesList = await this.getPagesList();

    return pagesList.reduce(
      (dictionary, page) => {
        const url = page.last_255;

        if (page.lang === 'en') {
          dictionary['en'][url] = page;
        } else if (page.lang === 'fr') {
          dictionary['fr'][url] = page;
        }

        return dictionary;
      },
      { en: {}, fr: {} } as Record<'en' | 'fr', Record<string, PagesList>>
    );
  }

  async repairUrls(pageMetrics: Partial<PageMetrics>[]) {
    const pagesListDictionary = await this.getPagesListDictionary().then(
      ({ en, fr }) => ({
        ...en,
        ...fr,
      })
    );

    return pageMetrics.map((metrics) => {
      if (metrics.url.startsWith('www.canada.ca')) {
        return metrics;
      }

      const url = pagesListDictionary[metrics.url]?.url || metrics.url;

      return {
        ...metrics,
        url,
      };
    });
  }
}
