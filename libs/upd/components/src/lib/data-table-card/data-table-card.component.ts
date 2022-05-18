import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-data-table-card',
  templateUrl: './data-table-card.component.html',
  styleUrls: ['./data-table-card.component.css'],
})
export class DataTableCardComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() displayRows = 10;
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: ColumnConfig[] = [];
  @Input() searchFields: string[] = [];
  @Input() captionTitle = '';
  @Input() kpi = false;
  @Input() sortField = '';
  @Input() sortOrder = 'asc';
  @Input() title = '';
  @Input() tooltip = '';

  loading!: boolean;

  ngOnInit() {
    if (this.searchFields.length === 0) {
      this.searchFields = this.cols.map((obj) => obj.field);
    }
  }
}
