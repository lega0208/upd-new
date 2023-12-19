import { Component, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import {
  type ColumnConfig,
  callVolumeObjectiveCriteria,
} from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import type { LocaleId } from '@dua-upd/upd/i18n';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'upd-overview-calldrivers',
  templateUrl: './overview-calldrivers.component.html',
  styleUrls: ['./overview-calldrivers.component.css'],
})
export class OverviewCalldriversComponent implements OnInit {
  private overviewService = inject(OverviewFacade);
  private i18n = inject(I18nFacade);

  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  dateRangeLabel$ = this.overviewService.dateRangeLabel$;
  comparisonDateRangeLabel$ = this.overviewService.comparisonDateRangeLabel$;

  currentCallVolume$ = this.overviewService.currentCallVolume$;
  callPercentChange$ = this.overviewService.callPercentChange$;

  apexCallDriversChart$ = this.overviewService.apexCallDriversChart$;

  // calldriversChart$ = this.overviewService.calldriversChart$;
  calldriversTable$ = this.overviewService.calldriversTable$;
  calldriversCols: ColumnConfig<{
    name: string;
    currValue: number;
    prevValue: number;
  }>[] = [];

  top25CalldriverTopics$ = this.overviewService.top25CalldriverTopics$;
  top25CalldriverTopicsConfig$ =
    this.overviewService.top25CalldriverTopicsConfig$;

  top5IncreasedCalldriverTopics$ =
    this.overviewService.top5IncreasedCalldriverTopics$;
  top5IncreasedCalldriverTopicsConfig$ =
    this.overviewService.top5IncreasedCalldriverTopicsConfig$;

  top5DecreasedCalldriverTopics$ =
    this.overviewService.top5DecreasedCalldriverTopics$;
  top5DecreasedCalldriverTopicsConfig$ =
    this.overviewService.top5DecreasedCalldriverTopicsConfig$;

  callVolumeObjectiveCriteria = callVolumeObjectiveCriteria;
  callVolumeKpiConfig = {
    pass: { message: 'kpi-met-volume' },
    fail: { message: 'kpi-not-met-volume' },
  };

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$,
      this.dateRangeLabel$,
      this.comparisonDateRangeLabel$,
    ]).subscribe(([lang, dateRange, comparisonDateRange]) => {
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
