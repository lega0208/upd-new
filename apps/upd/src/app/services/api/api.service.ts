import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Overall } from '@cra-arc/db';

export type QueryOptions = {
  metrics: {
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  };
};

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  queryParams?: Params;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params) => {
      this.queryParams = { ...params };
    });
  }

  getOverallMetrics(): Observable<Overall[]> {
    return this.http.get<Overall[]>('/api/overall', {
      params: this.queryParams,
      observe: 'body',
      responseType: 'json',
    });
  }

  getAllPages(): Observable<any> {
    return this.http.get('/api/pages/findAll', {
      observe: 'body',
      responseType: 'json',
    });
  }

  getPage(pageId: string): Observable<any> {
    return this.http.get(`/api/pages/${pageId}/`, {
      params: this.queryParams,
      observe: 'body',
      responseType: 'json',
    });
  }
}
