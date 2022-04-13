import { Component, Input, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-data-kpi-card',
  templateUrl: './data-kpi-card.component.html',
  styleUrls: ['./data-kpi-card.component.scss'],
})
export class DataKpiCardComponent implements OnInit {
  @Input() current: string | number = '';
  @Input() comparison = 0;
  @Input() date: Date | string = '';
  @Input() numUxTests = 0;
  @Input() title = '';
  @Input() tooltip = '';

  ngOnInit(): void {}

  constructor(public translateService: TranslateService) {}
}
