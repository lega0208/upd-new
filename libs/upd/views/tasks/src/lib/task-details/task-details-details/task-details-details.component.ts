import { Component } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'upd-task-details-details',
  templateUrl: './task-details-details.component.html',
  styleUrls: ['./task-details-details.component.css'],
})
export class TaskDetailsDetailsComponent {
  currentLang$ = this.i18n.currentLang$;

  detailsTable$ = this.taskDetailsService.detailsTable$;

  constructor(
    private readonly taskDetailsService: TasksDetailsFacade,
    private i18n: I18nFacade
  ) {}
}
