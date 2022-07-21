import { Component, Input } from '@angular/core';
import { ProjectStatus } from '@dua-upd/types-common';

@Component({
  selector: 'upd-project-status-label',
  template: `
    <span class="badge {{ classMap[statusText] }}">{{ statusText | translate }}</span>
  `,
  styleUrls: ['./project-status-label.component.scss'],
})
export class ProjectStatusLabelComponent {
  @Input() statusText: ProjectStatus = 'Unknown';

  classMap: Record<ProjectStatus, string> = {
    Unknown: 'bg-unknown',
    Planning: 'bg-planning',
    'In Progress': 'bg-in-progress',
    Complete: 'bg-complete',
    Delayed: 'bg-delayed',
    // todo: add missing classes
    Discovery: 'bg-discovery',
    'Being monitored': 'bg-being-monitored',
    'Needs review': 'bg-needs-review',
    Paused: 'bg-paused',
  };
}
