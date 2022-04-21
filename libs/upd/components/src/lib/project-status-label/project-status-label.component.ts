import { Component, Input } from '@angular/core';
import { ProjectStatus } from '@cra-arc/types-common';

@Component({
  selector: 'app-project-status-label',
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
    Discovery: '',
    'Being monitored': '',
    'Needs review': '',
    Paused: '',
  };
}
