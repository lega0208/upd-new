import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  @Input() data: unknown[] | null = [];
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle = '';
  @Input() loading = false;
  @Input() sortField = '';
  @Input() kpi = false;

  ngOnInit(): void {
    if (this.searchFields.length === 0) {
      this.searchFields = this.cols.map((obj) => obj.field);
    }
  }
}
