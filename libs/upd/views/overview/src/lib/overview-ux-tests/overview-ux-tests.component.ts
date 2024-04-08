import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { ColumnConfig } from '@dua-upd/types-common';
import { uxTestsKpiObjectiveCriteria } from '@dua-upd/upd-components';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA, FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import type { OverviewProject } from '@dua-upd/types-common';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { of } from 'rxjs';

@Component({
  selector: 'upd-overview-ux-tests',
  templateUrl: './overview-ux-tests.component.html',
  styleUrls: ['./overview-ux-tests.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewUxTestsComponent implements OnInit {
  private overviewService = inject(OverviewFacade);
  private i18n = inject(I18nFacade);

  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  currentLangSignal = this.i18n.currentLang;
  langLink = 'en';

  uxTestsKpiObjectiveCriteria = uxTestsKpiObjectiveCriteria;
  uxChartData = this.overviewService.projectsList$;

  tasksTested$ = this.overviewService.uxTasksTested$;
  participantsTested$ = this.overviewService.uxParticipantsTested$;
  testsConductedLastFiscal$ = this.overviewService.uxTestsConductedLastFiscal$;
  testsConductedLastQuarter$ =
    this.overviewService.uxTestsConductedLastQuarter$;
  COPSTests$ = this.overviewService.uxCopsTestsCompleted$;

  kpiUXTestsPercent$ = this.overviewService.kpiUXTestsPercent$;
  kpiUXTestsTotal$ = this.overviewService.kpiUXTestsTotal$;

  improvedKpiSuccessRate$ = this.overviewService.improvedKpiSuccessRate$;
  improvedKpiSuccessRateDifference$ = 
    this.overviewService.improvedKpiSuccessRateDifference$;

  improvedKpiSuccessRateValidation$ =
    this.overviewService.improvedKpiSuccessRateValidation$;
    
  improvedKpi$ = this.overviewService.improvedKpi$;
  improvedKpiUniqueTasks$ = this.overviewService.improvedKpiUniqueTasks$;

  kpiLastAvgSuccessRate$ = this.overviewService.kpiLastAvgSuccessRate$;
  kpiTestsCompleted$ = this.overviewService.kpiTestsCompleted$;
  uniqueTaskTestedLatestTestKpi$ =
    this.overviewService.uniqueTaskTestedLatestTestKpi$;
  kpiTotAvgSuccessRate$ = this.overviewService.kpiTotAvgSuccessRate$;

  uxChartCols: ColumnConfig<OverviewProject>[] = [];

  getDiffText(diff: number): string {
    if (diff > 0) {
      return 'increase';
    } else if (diff < 0) {
      return 'decrease';
    } else {
      return '';
    }
  }

  getColor(diff: number): string {
    if (diff > 0) {
      return '#26A69A';
    } else if (diff < 0) {
      return '#DF2929';
    } else {
      return '';
    }
  }

  ngOnInit() {
    this.currentLang$.subscribe((lang) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      this.uxChartCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('ux_projects', lang),
          type: 'link',
          typeParams: {
            preLink: '/' + this.langLink + '/projects',
            link: '_id',
          },
        },
        {
          field: 'testType',
          header: this.i18n.service.translate('Test', lang),
        },
        {
          field: 'startDate',
          header: this.i18n.service.translate('Start date', lang),
          pipe: 'date',
          pipeParam: lang === FR_CA ? 'd MMM YYYY' : 'MMM dd, YYYY',
        },
        {
          field: 'lastAvgSuccessRate',
          header: this.i18n.service.translate('Average success rate', lang),
          pipe: 'percent',
        },
        {
          field: 'totalUsers',
          header: this.i18n.service.translate('number_of_participants', lang),
        },
      ];
    });
  }
}
