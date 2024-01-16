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
import { ActivatedRoute } from '@angular/router';
import type { ReportStatus } from '@dua-upd/types-common';
import { ColumnConfig, UpdComponentsModule } from '@dua-upd/upd-components';
import { round } from '@dua-upd/utils-common';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, iif, map, mergeMap, Observable, takeWhile } from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'dua-upd-custom-reports-report',
  standalone: true,
  imports: [
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
})
export class CustomReportsReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private _zone = inject(NgZone);

  id: Signal<string> = toSignal(this.route.params.pipe(map((p) => p['id'])));

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
          header: key,
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
