import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  NgZone,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { ColumnConfig, ReportConfig, ReportStatus } from '@dua-upd/types-common';
import { UpdComponentsModule } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { round } from '@dua-upd/utils-common';
import {
  catchError,
  iif,
  map,
  mergeMap,
  Observable,
  takeWhile,
  of,
} from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiService } from '@dua-upd/upd/services';
import { I18nModule } from '@dua-upd/upd/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface ConfigData {
  data: {
    config: ReportConfig;
  }[];
}

@Component({
  selector: 'dua-upd-custom-reports-report',
  standalone: true,
  imports: [I18nModule, CommonModule, UpdComponentsModule, ProgressBarModule],
  templateUrl: './custom-reports-report.component.html',
  styleUrls: ['./custom-reports-report.component.scss'],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
    `,
  ],
  providers: [ApiService, I18nFacade],
})
export class CustomReportsReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private _zone = inject(NgZone);
  private readonly api = inject(ApiService);

  id: Signal<string> = toSignal(this.route.params.pipe(map((p) => p['id'])));

  configData: Signal<ConfigData | null | undefined> = toSignal(
    this.api.queryDb({
      data: {
        collection: 'customReportsRegistry',
        filter: { _id: this.id() },
        project: { config: 1 },
      },
    }),
  );

  config: Signal<ReportConfig | undefined> = computed(
    () => this.configData()?.data?.[0]?.config || undefined,
  );

  grouped = computed(() => (this.config()?.grouped ? 'Yes' : 'No'));
  granularity = computed(() =>
    this.config()?.granularity === 'day'
      ? 'Daily'
      : this.config()?.granularity === 'month'
      ? 'Monthly'
      : this.config()?.granularity === 'week'
      ? 'Weekly'
      : 'None',
  );
  startDate = computed(() =>
    dayjs.utc(this.config()?.dateRange?.start).format('YYYY-MM-DD'),
  );
  endDate = computed(() =>
    dayjs.utc(this.config()?.dateRange?.end).format('YYYY-MM-DD'),
  );
  urls = computed(() => this.config()?.urls || []);
  metrics = computed(() => this.config()?.metrics || []);
  breakdownDimension = computed(
    () => this.config()?.breakdownDimension || 'None',
  );

  goBack() {
    this.router.navigate(['../create'], {
      state: { config: this.config() },
      relativeTo: this.route,
    });
  }

  reportStatus: Signal<ReportStatus | undefined>;

  status = computed(() => this.reportStatus()?.status);

  message = computed(() => this.reportStatus()?.message);

  data = computed(() => this.reportStatus()?.data || null);

  progress = computed(() => {
    const totalJobs = this.reportStatus()?.totalChildJobs;

    const completedJobs = this.reportStatus()?.completedChildJobs || 0;

    if (!totalJobs) return NaN;

    return round((completedJobs / totalJobs) * 100, 0);
  });

  // todo: derive proper colConfig
  columns: Signal<ColumnConfig[]> = computed(() => {
    const data = this.data();

    if (!data?.length) return [];

    return Object.keys(data[0]).map(
      (key) =>
        ({
          field: key,
          header: key,
          ...(['startDate', 'endDate', 'date'].includes(key)
            ? { pipe: 'date' }
            : [
                'visits',
                'views',
                'visitors',
                'dyf_no',
                'dyf_yes',
                'dyf_submit',
              ].includes(key)
            ? { pipe: 'number' }
            : ['bouncerate'].includes(key)
            ? { pipe: 'percent' }
            : ['average_time_spent'].includes(key)
            ? { pipe: 'secondsToMinutes' }
            : []),
          translate: true,
        }) as ColumnConfig,
    );
  });

  error = computed(() =>
    this.reportStatus()?.status === 'error'
      ? this.reportStatus()?.message
      : null,
  );

  constructor() {
    const status$ = this.http.get<ReportStatus>(
      `/api/custom-reports/${this.id()}`,
    );

    const statusStream$ = this.setupEventSource();

    this.reportStatus = toSignal(
      status$.pipe(
        takeWhile(
          (response) => !['error', 'complete'].includes(response.status),
          true,
        ),
        takeUntilDestroyed(),
        mergeMap(({ status }) =>
          iif(() => status !== 'complete', statusStream$, status$),
        ),
        catchError((err) => {
          return of({
            status: 'error',
            message: err.message,
          }) as Observable<ReportStatus>;
        }),
      ),
    );
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupEventSource() {
    return new Observable<ReportStatus>((subscriber) => {
      const es = new EventSource(`/api/custom-reports/${this.id()}/status`);

      es.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data) as ReportStatus;
        this._zone.run(() => subscriber.next(message));

        if (message.status === 'complete') {
          this._zone.run(() => subscriber.complete());
        } else if (message.status === 'error') {
          this._zone.run(() => subscriber.error(new Error(message.message)));
          this._zone.run(() => subscriber.complete());
        }
      };

      es.onerror = (event: Event) => {
        this._zone.run(() => subscriber.error(event));
        this._zone.run(() => subscriber.complete());
      }

      return () => {
        es.close();
      }
    });
  }
}
