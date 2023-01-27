import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Table } from 'primeng/table';
import { equals } from 'rambdax';
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
  @Input() id?: string;
  @Input() placeholderText = 'dt_search_keyword';

  keys: string[] = [];

  colFilters = Object.fromEntries(
    this.cols
      .filter((col) => col.filterConfig)
      .map((col) => [col.header, [] as string[]])
  );

  setFilters(colField: string, colHeader: string, filters: string[]) {
    if (!filters.length) {
      delete this.colFilters[`${colHeader}:${colField}`];

      return;
    }
    this.colFilters[`${colHeader}:${colField}`] = filters;
  }

  resetFilters() {
    if (this.table?.filters && Object.keys(this.table.filters).length) {
      this.table.filters = {};
    }

    this.colFilters = {};

    console.log(this.colFilters);
  }

  deleteFilter(colHeader: string, filter: string) {
    this.colFilters[colHeader] = this.colFilters[colHeader].filter(
      (f) => f !== filter
    );

    this.table?.filter(
      this.colFilters[colHeader],
      colHeader.split(':')[1],
      'in'
    );

    this.table.filters[colHeader.split(':')[1]] = [
      {
        value:
          this.colFilters[colHeader].length === 0
            ? null
            : this.colFilters[colHeader],
        matchMode: 'in',
        operator: 'and',
      },
    ];

    if (Object.values(this.colFilters).every((v) => v.length === 0)) {
      this.colFilters = {};
    }
  }

  clearAll() {
    this.colFilters = {};
    this.table?.clear();
  }

  ngOnChanges(changes: SimpleChanges) {
    const colChanges = changes['cols'];

    if (!colChanges?.previousValue || colChanges.previousValue.length === 0) {
      return;
    }

    const prevHeaders = colChanges.previousValue.map(
      (col: ColumnConfig) => col.header
    );
    const currentHeaders = colChanges.currentValue.map(
      (col: ColumnConfig) => col.header
    );

    if (!equals(prevHeaders, currentHeaders)) {
      this.resetFilters();
      this.table?._filter();
      this.table?.clearState();
    }
  }

  get defaultSearchFields() {
    return this.cols.map((obj) => obj.field);
  }

  getEventValue(event: Event): string {
    return (event.target as HTMLInputElement).value.replace(
      /^.+?(?=www\.)/i,
      ''
    );
  }

  ngAfterContentChecked() {
    this.keys = Object.keys(this.colFilters);
  }
}
