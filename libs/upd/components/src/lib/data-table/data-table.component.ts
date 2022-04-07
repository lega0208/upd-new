import { Component, Input, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';

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
  @Input() cols: ColumnConfig[] = [];
  first = 0;
  @Input() searchFields: string[] = this.cols.map((obj) => obj.field);
  loading!: boolean;

  clear(table: Table) {
    table.clear();
  }

  constructor() {

  }
}
