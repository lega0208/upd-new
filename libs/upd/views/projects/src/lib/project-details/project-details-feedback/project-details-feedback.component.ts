import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { ProjectsDetailsFacade } from '../+state/projects-details.facade';

@Component({
  selector: 'app-project-details-feedback',
  templateUrl: './project-details-feedback.component.html',
  styleUrls: ['./project-details-feedback.component.css'],
})
export class ProjectDetailsFeedbackComponent {

  visitsByPage$ = this.projectsDetailsService.visitsByPage$;
  visitsByPageCols = [
    {
      field: 'url',
      header: 'Url',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id' },
    },
    {
      field: 'dyfYes',
      header: 'Yes',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'pagefeedback' },
    },
    {
      field: 'dyfNo',
      header: 'No',
      pipe: 'number',
      type: 'link',
      typeParams: { preLink: '/pages', link: '_id', postLink: 'pagefeedback' },
    },
    { field: '0', header: 'Comparison (for No answer)', pipe: 'percent' },
    { field: '0', header: '% of visitors who left feedback', pipe: 'percent' },
  ] as ColumnConfig[];

  dyfChart$ = this.projectsDetailsService.dyfData$;
  whatWasWrongChart$ = this.projectsDetailsService.whatWasWrongData$;
  
  constructor(private readonly projectsDetailsService: ProjectsDetailsFacade) {}
}
