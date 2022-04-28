import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-data-kpi-table',
  templateUrl: './data-kpi-table.component.html',
  styleUrls: ['./data-kpi-table.component.css'],
})
export class DataKpiTableComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  @Input() data: unknown[] | null = [];
  @Input() displayRows: number = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle: string = '';
  @Input() loading: boolean = false;
  @Input() sortField: string = '';

  constructor(public translateService: TranslateService) {}

  ngOnInit(): void {
    if (this.searchFields.length === 0) {
      this.searchFields = this.cols.map((obj) => obj.field);
    }
  }
}
