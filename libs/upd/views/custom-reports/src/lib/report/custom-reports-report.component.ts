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
import type { ReportConfig, ReportStatus } from '@dua-upd/types-common';
import { ColumnConfig, UpdComponentsModule } from '@dua-upd/upd-components';
import { round } from '@dua-upd/utils-common';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, iif, map, mergeMap, Observable, takeWhile } from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiService } from '@dua-upd/upd/services';
import { I18nModule, I18nService } from '@dua-upd/upd/i18n';
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
  imports: [
    I18nModule,
    CommonModule,
    UpdComponentsModule,
    ProgressBarModule,
    TranslateModule,
  ],
  templateUrl: './custom-reports-report.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
    `,
  ],
  providers: [ApiService, I18nService],
})
export class CustomReportsReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private _zone = inject(NgZone);
  private i18n = inject(I18nService);
  private readonly api = inject(ApiService);

  lang = this.i18n.langSignal;
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

  config = computed(() => {
    const config = this.configData()?.data[0].config as ReportConfig;

    return {
      ...config,
      dateRange: {
        start: config.dateRange.start,
        end: config.dateRange.end
      }
    };
  });

  grouped = computed(() => (this.config()?.grouped ? 'Yes' : 'No'));
  granularity = computed(() =>
    this.config()?.granularity === 'day'
      ? 'Daily'
      : this.config()?.granularity === 'month'
      ? 'Monthly'
      : 'Weekly',
  );
  startDate = computed(() =>
    dayjs(this.config()?.dateRange?.start as string)
      .utc()
      .format('YYYY-MM-DD'),
  );
  endDate = computed(() =>
    dayjs(this.config()?.dateRange?.end as string)
      .utc()
      .format('YYYY-MM-DD'),
  );
  urls = computed(() => this.config()?.urls || []);
  metrics = computed(() => this.config()?.metrics || []);
  breakdownDimension = computed(
    () => this.config()?.breakdownDimension || 'None',
  );

  goBack() {
    this.router.navigate(
      [`/${this.lang().slice(0, 2)}/custom-reports/create`],
      { state: { config: this.config() } },
    );
  }

  reportStatus: Signal<ReportStatus | undefined>;

  status = computed(() => this.reportStatus()?.status);

  message = computed(() => this.reportStatus()?.message);

  data = computed(() => this.reportStatus()?.data || null);

  progress = computed(() => {
    const totalJobs = this.reportStatus()?.totalChildJobs;

    const completedJobs = this.reportStatus()?.completedChildJobs;

    if (!totalJobs || !completedJobs || totalJobs === 0) return NaN;

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
          header: this.i18n.translate(key, this.lang()),
          ...(['startDate', 'endDate', 'date'].includes(key)
            ? { pipe: 'date' }
            : {}),
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
        // debounceTime(500), // play around with this if we want to try to avoid flickering
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
        }
      };

      return () => es.close();
    });
  }
}
