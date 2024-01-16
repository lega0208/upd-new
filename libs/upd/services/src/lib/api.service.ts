import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { DbQuery } from '@dua-upd/types-common';
import type {
  ApiParams,
  OverviewData,
  PageDetailsData,
  PagesHomeData,
  ProjectsHomeData,
  TasksHomeData,
  TaskDetailsData,
  ProjectsDetailsData,
  ReportsData,
} from '@dua-upd/types-common';

export interface ReturnedData<T> {
  dateRange: T;
  comparisonDateRange?: T;
}

@Injectable()
export class ApiService {
  private http = inject(HttpClient);

  // @StorageCache
  private get<T>(url: string, params?: ApiParams) {
    return this.http.get<T>(url, { params, responseType: 'json' });
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

  getTasksHomeData(params: ApiParams) {
    return this.get<TasksHomeData>('/api/tasks/home', params);
  }

  getTasksDetailsData(params: ApiParams) {
    return this.get<TaskDetailsData>('/api/tasks/details', params);
  }

  getProjectsHomeData() {
    return this.http.get<ProjectsHomeData>('/api/projects/home');
  }

  getProjectsDetailsData(params: ApiParams) {
    return this.get<ProjectsDetailsData>('/api/projects/details', params);
  }

  getReportsData() {
    return this.http.get<ReportsData>('/api/reports');
  }

  getInternalSearchData(params: ApiParams) {
    return this.get('/api/internal-search/terms', params);
  }

  queryDb<T>(params: DbQuery) {
    const serializedQueries = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        btoa(JSON.stringify(value)),
      ]),
    );

    return this.http.get<T>('/api/query', { params: serializedQueries });
  }
}
