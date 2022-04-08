import { Component, Input } from '@angular/core';
import { ProjectStatus } from '@cra-arc/types-common';

@Component({
  selector: 'app-project-status-label',
  template: `
    <span class="badge {{ classMap[statusText] }}">{{ statusText }}</span>
  `,
  styles: []
})
export class ProjectStatusLabelComponent {
  @Input() statusText: ProjectStatus = 'Unknown';

  // Change type to Record<ProjectStatus, string>
  classMap: Record<string, string> = {
    'Unknown': 'bg-secondary',
  }
}
