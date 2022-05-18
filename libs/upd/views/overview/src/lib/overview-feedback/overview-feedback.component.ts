import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;

  dyfChart$ = this.overviewService.dyfData$;
  whatWasWrongChart$ = this.overviewService.whatWasWrongData$;

  dyfTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  whatWasWrongTableCols: ColumnConfig<{ name: string; value: number }>[] = [];
  taskSurveyCols: ColumnConfig<{ task: string; completion: number }>[] = [];

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.dyfTableCols = [
        { field: 'name', header: this.i18n.service.translate('Selection', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' }
      ];
      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' }
      ];
      this.taskSurveyCols = [
        { field: 'task', header: this.i18n.service.translate('task', lang) },
        { field: 'completion', header: this.i18n.service.translate('Task Success Survey Completed', lang) }
      ];

    });
  }
}
