import { Component, Input, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { columnConfig } from '../data-table-styles/types';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent {
  @ViewChild('dt') table!: Table;
  @Input() data: unknown[] | null = [];
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: columnConfig[] = [];
  first = 0;
  searchFields: string[] = this.cols.map((obj) => obj.field);
  loading!: boolean;

  clear(table: Table) {
    table.clear();
  }

  constructor() {}
}
