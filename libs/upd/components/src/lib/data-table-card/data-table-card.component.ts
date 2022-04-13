import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColumnConfig } from '../data-table-styles/types';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-data-table-card',
  templateUrl: './data-table-card.component.html',
  styleUrls: ['./data-table-card.component.css'],
})
export class DataTableCardComponent implements OnInit {
  constructor(public translateService: TranslateService) {}
  @Input() data: any[] = [];
  @Input() displayRows: number = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle: string = '';

  @Input() title = '';
  @Input() tooltip = '';

  loading!: boolean;

  ngOnInit(): void {
    if (this.searchFields.length === 0) {
      this.searchFields = this.cols.map((obj) => obj.field);
    }
  }
}
