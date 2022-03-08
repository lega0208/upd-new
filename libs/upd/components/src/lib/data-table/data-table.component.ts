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
  data: any[] = [];
  cols!: any[];
  first = 0;
  searchFields: string[] = [];
  loading!: boolean;

  // "keyvalues" pipe automatically sorts, which we don't want
  originalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>) =>
    0;

  constructor() {}

  ngOnInit(): void {
    this.loading = true;

    this.getData();

    this.cols = [
      // { field: 'airtableId', header: 'Airtable ID'},
      // { field: '_id', header: 'ID' },
      // { field: 'all_urls', header: 'all_urls' },
      // { field: 'language', header: 'language'},
      // { field: 'lastChecked', header: 'lastChecked'},
      // { field: 'lastModified', header: 'lastModified'},
      { field: 'title', header: 'Title' },
      { field: 'url', header: 'URL' },
    ];
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