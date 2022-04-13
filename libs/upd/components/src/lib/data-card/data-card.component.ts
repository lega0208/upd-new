import { Component, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent {
  @Input() current: string | number = 0;
  @Input() comparison = 0;
  @Input() date!: Date | string;
  @Input() numUxTests = 0;
  @Input() title = '';
  @Input() tooltip = '';

  constructor(public translateService: TranslateService) {}
}
