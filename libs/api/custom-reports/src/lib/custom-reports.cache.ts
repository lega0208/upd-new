import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { ReportDataPoint } from './custom-reports.service';

type Report = Record<string, unknown>[];

@Injectable()
export class CustomReportsCache {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getReport(reportId: string): Promise<Report | undefined> {
    return await this.cache.get<Report>(`report:${reportId}`);
  }

  async setReport(reportId: string, report: Report) {
    return await this.cache.set(`report:${reportId}`, report);
  }

  async getDataPoints(dataPointHashes: string[]) {
    return await this.cache.store.mget(...dataPointHashes) as Record<string, ReportDataPoint>[];
  }

  async setDataPoints(dataPoints: Record<string, ReportDataPoint>) {
    return await this.cache.store.mset(Object.entries(dataPoints), 60 * 60 * 3); // 3 hours
  }
}
