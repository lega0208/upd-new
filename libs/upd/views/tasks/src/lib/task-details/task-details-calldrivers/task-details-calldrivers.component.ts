import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { I18nFacade } from '@dua-upd/upd/state';
import { ColumnConfig } from '@dua-upd/upd-components';
import { TasksDetailsFacade } from '../+state/tasks-details.facade';

@Component({
  selector: 'upd-task-details-calldrivers',
  templateUrl: './task-details-calldrivers.component.html',
  styleUrls: ['./task-details-calldrivers.component.css'],
})
export class TaskDetailsCalldriversComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  calldriversChart$ = this.taskDetailsService.calldriversChart$;
  calldriversTable$ = this.taskDetailsService.calldriversTable$;
  calldriversCols: ColumnConfig[] = [];

  currentCallVolume$ = this.taskDetailsService.currentCallVolume$;
  callPercentChange$ = this.taskDetailsService.callPercentChange$;

  callsByTopic$ = this.taskDetailsService.callsByTopic$;
  callsByTopicConfig$ = this.taskDetailsService.callsByTopicConfig$;

  dateRangeLabel$ = this.taskDetailsService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.taskDetailsService.comparisonDateRangeLabel$;

  constructor(private readonly taskDetailsService: TasksDetailsFacade, private i18n: I18nFacade) {}

  ngOnInit() {
    combineLatest([this.currentLang$, this.dateRangeLabel$, this.comparisonDateRangeLabel$]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.calldriversCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Inquiry line', lang),
        },
        {
          field: 'currValue',
          header: dateRange,
          pipe: 'number',
        },
        {
          field: 'prevValue',
          header: comparisonDateRange,
          pipe: 'number',
        },
      ];
    });
  }
}
