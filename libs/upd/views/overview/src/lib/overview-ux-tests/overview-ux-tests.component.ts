import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { OverviewProject } from '@cra-arc/types-common';
import { OverviewFacade } from '../+state/overview/overview.facade';

@Component({
  selector: 'app-overview-ux-tests',
  templateUrl: './overview-ux-tests.component.html',
  styleUrls: ['./overview-ux-tests.component.css'],
})
export class OverviewUxTestsComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;
  langLink = 'en';

  uxChartData = this.overviewService.projectsList$;

  testsCompleted$ = this.overviewService.uxTestsCompleted$;
  tasksTested$ = this.overviewService.uxTasksTested$;
  participantsTested$ = this.overviewService.uxParticipantsTested$;
  testsConductedLastFiscal$ = this.overviewService.uxTestsConductedLastFiscal$;
  testsConductedLastQuarter$ = this.overviewService.uxTestsConductedLastQuarter$;
  COPSTests$ = this.overviewService.uxCopsTestsCompleted$;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  uxChartCols: ColumnConfig<OverviewProject>[] = [];

  ngOnInit() {
    this.currentLang$.subscribe((lang) => {
      this.langLink = lang === EN_CA ? 'en' : 'fr';

      this.uxChartCols = [
        {
          field: 'title',
          header: this.i18n.service.translate('ux_projects', lang),
          type: 'link',
          typeParams: { preLink: '/' + this.langLink + '/projects', link: '_id' },
        },
        {
          field: 'testType',
          header: this.i18n.service.translate('Test', lang),
        },
        {
          field: 'startDate',
          header: this.i18n.service.translate('date', lang),
        },
        {
          field: 'avgSuccessRate',
          header: this.i18n.service.translate('score', lang),
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
