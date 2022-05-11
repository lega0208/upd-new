import { Component, OnInit } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import dayjs from 'dayjs';
import { MultiSeries, SingleSeries } from '@amonsour/ngx-charts';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview-feedback',
  templateUrl: './overview-feedback.component.html',
  styleUrls: ['./overview-feedback.component.css'],
})
export class OverviewFeedbackComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  taskSurvey = taskSurvey;

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
    this.i18n.service.onLangChange(
      ({ lang }) => { this.currentLang = lang as LocaleId; }
    );

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

const taskSurvey = [
  { id: 1, task: 'Shufflester', completion: 191 },
  { id: 2, task: 'Yotz', completion: 189 },
  { id: 3, task: 'Shuffletag', completion: 65 },
  { id: 4, task: 'Feednation', completion: 132 },
  { id: 5, task: 'Zoonder', completion: 153 },
  { id: 6, task: 'Jabbersphere', completion: 97 },
  { id: 7, task: 'Devpulse', completion: 84 },
  { id: 8, task: 'Photofeed', completion: 172 },
  { id: 9, task: 'Meemm', completion: 205 },
  { id: 10, task: 'Jetwire', completion: 176 },
];
