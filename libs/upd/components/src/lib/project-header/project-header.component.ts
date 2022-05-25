import { Component, Input } from '@angular/core';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-project-header',
  templateUrl: './project-header.component.html',
  styleUrls: ['./project-header.component.scss'],
})
export class ProjectHeaderComponent {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string>[] = [];
}
