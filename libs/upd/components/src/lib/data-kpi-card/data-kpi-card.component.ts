import { Component, Input } from '@angular/core';

import { I18nService } from '@cra-arc/upd/i18n';
@Component({
  selector: 'app-data-kpi-card',
  templateUrl: './data-kpi-card.component.html',
  styleUrls: ['./data-kpi-card.component.scss'],
})
export class DataKpiCardComponent {
  @Input() current: string | number = '';
  @Input() comparison = 0;
  @Input() date: Date | string = '';
  @Input() numUxTests = 0;
  @Input() title = '';
  @Input() tooltip = '';

  constructor(public i18n: I18nService) {}
}
