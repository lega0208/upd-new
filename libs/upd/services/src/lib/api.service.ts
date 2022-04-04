import { HttpClient } from '@angular/common/http';
import { ReturnedData, StorageCache } from './storage-cache.decorator';
import { OverviewData, PageDetailsData, PagesHomeData } from '@cra-arc/types-common';
import { Injectable } from '@angular/core';

export type ApiParams = {
  dateRange: string;
  comparisonDateRange?: string;
  id?: string;
};

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  // @StorageCache
  get<T extends ReturnedData<unknown>>(url: string, params?: ApiParams) {
    return this.http.get<T>(url, { params });
  }

  getPagesHomeData(params: ApiParams) {
    return this.get<PagesHomeData>('/api/pages/home', params);
  }

  getPageDetails(params: ApiParams) {
    return this.get<PageDetailsData>('/api/pages/details', params);
  }

  getOverviewData(params: ApiParams) {
    return this.get<OverviewData>('/api/overall', params);
  }
}
