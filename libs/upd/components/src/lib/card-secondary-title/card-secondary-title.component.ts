import { Component, Input } from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-card-secondary-title',
  templateUrl: './card-secondary-title.component.html',
  styleUrls: ['./card-secondary-title.component.scss'],
})
export class CardSecondaryTitleComponent {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string>[] = [];
  @Input() type = 'list';
  @Input() modal = '';
}
