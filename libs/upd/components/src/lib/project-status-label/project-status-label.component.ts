import { Component, Input } from '@angular/core';
import { ProjectStatus, pageStatus, projectType } from '@dua-upd/types-common';

@Component({
  selector: 'upd-project-status-label',
  template: `
    <span *ngIf="projectStatus" class="badge {{ styleClass }}  {{ projectStatusClassMap[projectStatus] }}">{{ projectStatus | translate }}</span>
    <span *ngIf="pageStatus" class="badge rounded-pill {{ styleClass }}  {{ pageStatusClassMap[pageStatus] }}">{{ pageStatus | translate }}</span>
    <span *ngIf="projectType" class="badge {{ styleClass }} {{ projectTypeClassMap[projectType] }}">{{ projectType | translate }}</span>
  `,
  styleUrls: ['./project-status-label.component.scss'],
})
export class ProjectStatusLabelComponent {
  @Input() projectStatus: ProjectStatus | null = null;
  @Input() pageStatus: pageStatus | null = null;
  @Input() projectType: projectType | null = null;
  @Input() styleClass: string | null = null;

  projectStatusClassMap: Record<ProjectStatus, string> = {
    Unknown: 'bg-unknown',
    Planning: 'bg-planning',
    'In Progress': 'bg-in-progress',
    Complete: 'bg-complete',
    Delayed: 'bg-delayed',
    Exploratory: 'bg-exploratory',
    'Being monitored': 'bg-being-monitored',
    'Needs review': 'bg-needs-review',
    Paused: 'bg-paused',
  };

  pageStatusClassMap: Record<pageStatus, string> = {
    '404': 'bg-404',
    'Redirect': 'bg-redirect',
  };

  projectTypeClassMap: Record<projectType, string> = {
    'COPS': 'bg-primary',
  };
}