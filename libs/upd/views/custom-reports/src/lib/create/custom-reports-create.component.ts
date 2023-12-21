import {
  Component,
  inject,
  NgZone,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { ReportConfig, ReportCreateResponse } from '@dua-upd/types-common';

const hardcodedConfig: ReportConfig = {
  dateRange: {
    start: new Date('2023-11-26').toISOString(),
    end: new Date('2023-12-07').toISOString(),
  },
  granularity: 'day',
  urls: [
    'www.canada.ca/fr/agence-revenu/services/services-electroniques/representer-client/a-propos-representer-client.html',
    'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client/about-represent-a-client.html',
    'www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html',
    'www.canada.ca/fr/agence-revenu/services/services-electroniques/representer-client.html',
    'www.canada.ca/en/revenue-agency/services/e-services/payment-save-time-pay-online.html',
    'www.canada.ca/fr/agence-revenu/services/services-electroniques/paiement-gagnez-temps-payez-ligne.html'
  ],
  grouped: false,
  metrics: ['visits', 'views', 'visitors'],
};
// @@@ basically just go through everything and start committing?
@Component({
  selector: 'dua-upd-custom-reports-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-reports-create.component.html',
  styles: [],
})
export class CustomReportsCreateComponent {
  private router = inject(Router);
  private zone: NgZone = inject(NgZone);

  error: WritableSignal<string | null> = signal(null);

  config: ReportConfig = hardcodedConfig;

  async createReport(config: ReportConfig) {
    const res: ReportCreateResponse = await fetch(
      '/api/custom-reports/create',
      {
        method: 'POST',
        body: JSON.stringify(config),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).then((res) => res.json());

    if ('error' in res) {
      this.error.set(res.error);

      return;
    }

    await this.zone.run(() =>
      this.router.navigateByUrl(`/en/custom-reports/${res._id}`),
    );
  }
}
