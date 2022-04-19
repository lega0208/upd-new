import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReturnedData, StorageCache } from './storage-cache.decorator';
import {
  OverviewData,
  PageDetailsData,
  PagesHomeData,
  ProjectsHomeData,
  TasksHomeData,
  TaskDetailsData, ProjectsDetailsData
} from '@cra-arc/types-common';

export type ApiParams = {
  dateRange: string;
  comparisonDateRange?: string;
  id?: string;
};

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  // @StorageCache
  private get<T extends ReturnedData<unknown>>(url: string, params?: ApiParams) {
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
}
