import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { columnConfig } from '../data-table-styles/types';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  @Input() data: unknown[] | null = [];
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: columnConfig[] = [];
  searchFields: string[] = [];
  first = 0;
  loading!: boolean;

  clear(table: Table) {
    table.clear();
  }

  ngOnInit(): void {
    this.searchFields = this.cols.map((obj) => obj.field);
  }

  constructor() {}
}
