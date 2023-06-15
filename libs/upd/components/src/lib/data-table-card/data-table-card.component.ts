import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-data-table-card',
  templateUrl: './data-table-card.component.html',
  styleUrls: ['./data-table-card.component.css'],
})
export class DataTableCardComponent<T> {
  @Input() data: T[] = [];
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle = '';
  @Input() kpi = false;
  @Input() sortField = '';
  @Input() sortOrder: 'asc' | 'desc' | number = 'asc';
  @Input() title = '';
  @Input() tooltip = '';
  @Input() loading = false;
  @Input() showFixedFirstColumn = false;

  get defaultSearchFields() {
    return this.cols.map((obj) => obj.field);
  }
}
