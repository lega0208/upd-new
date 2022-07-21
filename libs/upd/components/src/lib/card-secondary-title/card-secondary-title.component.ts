import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-card-secondary-title',
  templateUrl: './card-secondary-title.component.html',
  styleUrls: ['./card-secondary-title.component.scss'],
})
export class CardSecondaryTitleComponent implements OnInit {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string>[] = [];

  constructor() {}

  ngOnInit(): void {}
}
