import { Component, Input, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

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
  @Input() cols: { field: string; header: string }[] = [];
  first = 0;
  @Input() searchFields: string[] = [];
  loading!: boolean;

  clear(table: Table) {
    table.clear();
  }
}
