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
  @Input() data: any[] = [];
  datas: { id: number; task: string; completion: number }[] = [];
  @Input() sort = true;
  @Input() pagination = true;
  @Input() filter = true;
  @Input() cols: { field: string; header: string }[] = [];
  first = 0;
  searchFields: string[] = [];
  loading!: boolean;

  constructor() {}

  ngOnInit(): void {
    // //this.loading = true;
    // console.log(this.data);
    // console.log(this.cols);
    // console.log(this.searchFields);
    this.datas = taskSurvey;
    this.searchFields = this.cols.map((obj) => obj.field);
  }

  clear(table: Table) {
    table.clear();
  }
}

const taskSurvey = [
  { id: 1, task: 'Shufflester', completion: 191 },
  { id: 2, task: 'Yotz', completion: 189 },
  { id: 3, task: 'Shuffletag', completion: 65 },
  { id: 4, task: 'Feednation', completion: 132 },
  { id: 5, task: 'Zoonder', completion: 153 },
  { id: 6, task: 'Jabbersphere', completion: 97 },
  { id: 7, task: 'Devpulse', completion: 84 },
  { id: 8, task: 'Photofeed', completion: 172 },
  { id: 9, task: 'Meemm', completion: 205 },
  { id: 10, task: 'Jetwire', completion: 176 },
];
