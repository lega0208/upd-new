import { Component, Input, OnInit } from '@angular/core';
import { columnConfig } from './types';

@Component({
  selector: 'app-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
})
export class DataTableStylesComponent implements OnInit {
  @Input() config!: columnConfig;
  @Input() href: string = '';
  @Input() data: any;
  @Input() hasData = false;

  hasType = false;
  hasPipe = false;

  constructor() {}

  ngOnInit(): void {
    this.hasType = this.config.hasOwnProperty('type');
    this.hasPipe = this.config.hasOwnProperty('pipe');
  }
}
