import { Component, Input } from '@angular/core';
import { ColumnConfig } from '@dua-upd/upd-components';

@Component({
  selector: 'upd-project-header',
  templateUrl: './project-header.component.html',
  styleUrls: ['./project-header.component.scss'],
})
export class ProjectHeaderComponent {
  @Input() config: ColumnConfig[] = [];
  @Input() data: Record<string, number | string>[] = [];
}
