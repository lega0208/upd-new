import { Component, Input, OnInit } from '@angular/core';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
})
export class DataTableComponent implements OnInit {
  @Input('table-data') data: any[] = [];

  get colnames() {
    return this.data.length > 0 ? Object.keys(this.data[0]) : [];
  }

  // "keyvalues" pipe automatically sorts, which we don't want
  originalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>) =>
    0;

  constructor() {}

  ngOnInit(): void {}
}
