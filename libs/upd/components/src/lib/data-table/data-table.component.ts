import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent<T> implements OnChanges {
  @ViewChild('dt') table!: Table;
  @Input() data: T[] | null = [];
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle = '';
  @Input() loading = false;
  @Input() sortField = '';
  @Input() sortOrder: 'asc' | 'desc' | number = 'asc';
  @Input() kpi = false;
  @Input() exports = true;

  ngOnChanges(changes: SimpleChanges) {
    const colChanges = changes['cols'];

    if (
      colChanges &&
      colChanges.previousValue?.length !== 0 &&
      colChanges.currentValue !== colChanges.previousValue
    ) {
      this.table?.clearState();
    }
  }

  get defaultSearchFields() {
    return this.cols.map((obj) => obj.field);
  }
}
