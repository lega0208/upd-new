import { KeyValue } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from 'primeng/api';
//import { ApiService } from '../../../services/api/api.service';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  @Input('table-data') datas!: any[];
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: Array<{ field: string; header: string }> = [];
  first = 0;
  searchFields: string[] = [];
  loading!: boolean;

  constructor() {}

  ngOnInit(): void {
    //this.loading = true;

    this.getData();

    this.searchFields = this.cols.map((obj) => obj.field);
  }

  clear(table: Table) {
    table.clear();
  }

  getData(): void {
    // this.apiService.getAllPages().subscribe((data: any) => {
    //   this.data = data;
    //   this.loading = false;
    // });
  }
}
