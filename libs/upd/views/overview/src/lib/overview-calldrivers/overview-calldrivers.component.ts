import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { ColumnConfig } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-calldrivers',
  templateUrl: './overview-calldrivers.component.html',
  styleUrls: ['./overview-calldrivers.component.css'],
})
export class OverviewCalldriversComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  currentCallVolume$ = this.overviewService.currentCallVolume$;
  callPercentChange$ = this.overviewService.callPercentChange$;

  calldriversChart$ = this.overviewService.calldriversChart$;
  calldriversTable$ = this.overviewService.calldriversTable$;
  calldriversCols: ColumnConfig<{
    name: string;
    currValue: number;
    prevValue: number;
  }>[] = [];
  chartsCols: ColumnConfig[] = [];

  top5CalldriverTopics$ = this.overviewService.top5CalldriverTopics$;
  top5CalldriverTopicsConfig$ =
    this.overviewService.top5CalldriverTopicsConfig$;

  top5IncreasedCalldriverTopics$ =
    this.overviewService.top5IncreasedCalldriverTopics$;
  top5IncreasedCalldriverTopicsConfig$ =
    this.overviewService.top5IncreasedCalldriverTopicsConfig$;

  top5DecreasedCalldriverTopics$ =
    this.overviewService.top5DecreasedCalldriverTopics$;
  top5DecreasedCalldriverTopicsConfig$ =
    this.overviewService.top5DecreasedCalldriverTopicsConfig$;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
      this.chartsCols = [
        { field: 'Topic', header: this.i18n.service.translate('topic', lang) },
        {
          field: this.i18n.service.translate('Number of calls for', lang, {
            value: ' Feb 27-Mar 05',
          }),
          header: this.i18n.service.translate('Number of calls for', lang, {
            value: ' Feb 27-Mar 05',
          }),
        },
        {
          field: this.i18n.service.translate('Number of calls for', lang, {
            value: ' Mar 06-Mar 12',
          }),
          header: this.i18n.service.translate('Number of calls for', lang, {
            value: ' Mar 06-Mar 12',
          }),
        },
      ];
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
