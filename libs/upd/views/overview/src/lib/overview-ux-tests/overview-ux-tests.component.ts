import { Component, OnInit } from '@angular/core';
import { ColumnConfig } from '@cra-arc/upd-components';
import { OverviewFacade } from '../+state/overview/overview.facade';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-overview-ux-tests',
  templateUrl: './overview-ux-tests.component.html',
  styleUrls: ['./overview-ux-tests.component.css'],
})
export class OverviewUxTestsComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  uxChartData = uxChart;
  // uxChartCols: ColumnConfig[] = [
  //   { field: 'UX projects', header: 'UX projects' },
  //   { field: 'Test', header: 'Test' },
  //   { field: 'Date', header: 'Date' },
  //   { field: 'Score', header: 'Score' },
  //   { field: 'Participants', header: 'Participants' },
  // ];

  testsCompleted = 36;
  tasksTested = 254;
  participantsTested = 1710;

  testsConducted = 28;
  testsConductedLastQuarter = 4;
  COPSTests = 21;

  constructor(
    private overviewService: OverviewFacade,
    private i18n: I18nFacade
  ) {}

  uxChartCols: ColumnConfig[] = [];

  ngOnInit() {

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      

      this.uxChartCols = [
        { field: 'UX projects', header: this.i18n.service.translate('ux_projects', lang) },
        { field: 'Test', header: this.i18n.service.translate('Test', lang) },
        { field: 'Date', header: this.i18n.service.translate('date', lang) },
        { field: 'Score', header: this.i18n.service.translate('Score', lang) },
        { field: 'Participants', header: this.i18n.service.translate('number_of_participants', lang) },
      ];

    });
  }
}

const uxChart = [
  {
    'UX projects': 'Tourism and Hospitality Recovery Program (THRP)',
    Test: 'Baseline',
    Date: '',
    Score: 'NAN%',
    Participants: 0,
  },
  {
    'UX projects': 'Disability Tax Credit',
    Test: 'Validation',
    Date: '',
    Score: 'NAN%',
    Participants: 0,
  },
  {
    'UX projects': 'SR&ED',
    Test: 'Baseline',
    Date: '',
    Score: 'NAN%',
    Participants: 0,
  },
  {
    'UX projects': 'Hardest Hit Business Recovery Program (HHBRP)',
    Test: 'Baseline',
    Date: '',
    Score: 'NAN%',
    Participants: 0,
  },
  {
    'UX projects': 'Canada Workers Lockdown Benefit (CWLB)',
    Test: 'N/A',
    Date: '',
    Score: 'NAN%',
    Participants: 0,
  },
  {
    'UX projects': 'End of Life',
    Test: 'Validation',
    Date: '',
    Score: '28%',
    Participants: 118,
  },
  {
    'UX projects': 'SPR Baseline 5',
    Test: 'Baseline',
    Date: '12/2021',
    Score: '44%',
    Participants: 48,
  },
  {
    'UX projects': 'SPR Baseline 4',
    Test: 'Baseline',
    Date: '11/2021',
    Score: '48%',
    Participants: 48,
  },
  {
    'UX projects': 'SPR Baseline 3',
    Test: 'Baseline',
    Date: '10/2021',
    Score: '72%',
    Participants: 56,
  },
  {
    'UX projects': 'SPR Baseline 2',
    Test: 'Baseline',
    Date: '09/2021',
    Score: '84%',
    Participants: 56,
  },
  {
    'UX projects': 'SPR Baseline 1',
    Test: 'Baseline',
    Date: '09/2021',
    Score: '96%',
    Participants: 48,
  },
  {
    'UX projects': 'Canada Recovery Hiring Program (CRHP)',
    Test: 'Baseline',
    Date: '09/2021',
    Score: '66%',
    Participants: 0,
  },
  {
    'UX projects': 'Outreach',
    Test: 'Validation',
    Date: '06/2021',
    Score: '77%',
    Participants: 0,
  },
  {
    'UX projects': 'Cancel or waive penalties & interest',
    Test: 'Baseline',
    Date: '06/2021',
    Score: '63%',
    Participants: 60,
  },
  {
    'UX projects': 'Task Performance Indicators - (May 2021)',
    Test: 'Baseline',
    Date: '05/2021',
    Score: '79%',
    Participants: 119,
  },
  {
    'UX projects': 'Payments for Individuals (May 2021)',
    Test: 'Validation',
    Date: '05/2021',
    Score: '61%',
    Participants: 108,
  },
  {
    'UX projects': 'Payments for Individuals (March 2021)',
    Test: 'Baseline',
    Date: '03/2021',
    Score: '30%',
    Participants: 108,
  },
  {
    'UX projects': 'How to File 2021',
    Test: 'Validation',
    Date: '03/2021',
    Score: '65%',
    Participants: 198,
  },
  {
    'UX projects': 'Indigenous Taxes',
    Test: 'Baseline',
    Date: '02/2021',
    Score: '80%',
    Participants: 0,
  },
  {
    'UX projects': 'Scams and fraud',
    Test: 'Baseline',
    Date: '01/2021',
    Score: '68%',
    Participants: 0,
  },
  {
    'UX projects': 'Task Performance Indicators - Baseline (Dec 2020)',
    Test: 'Baseline',
    Date: '12/2020',
    Score: '71%',
    Participants: 118,
  },
  {
    'UX projects':
      'Home work space expenses - User experience web content improvements - R3',
    Test: 'Baseline',
    Date: '11/2020',
    Score: '48%',
    Participants: 48,
  },
  {
    'UX projects': 'CERS pre launch MVP',
    Test: 'Validation',
    Date: '11/2020',
    Score: '63%',
    Participants: 45,
  },
  {
    'UX projects':
      'Home work space expenses - User experience web content improvements - baseline (Test 2)',
    Test: 'Baseline',
    Date: '10/2020',
    Score: '42%',
    Participants: 48,
  },
  {
    'UX projects': 'CRB - Post-launch test',
    Test: 'Baseline',
    Date: '10/2020',
    Score: '55%',
    Participants: 40,
  },
  {
    'UX projects': 'CRSB  - Post-launch test 1',
    Test: 'Baseline',
    Date: '10/2020',
    Score: '71%',
    Participants: 48,
  },
  {
    'UX projects': 'CRCB  - Post-launch test 1',
    Test: 'Baseline',
    Date: '10/2020',
    Score: '71%',
    Participants: 48,
  },
  {
    'UX projects':
      'Home work space expenses - User experience web content improvements - R1 (prototype)',
    Test: 'Baseline',
    Date: '10/2020',
    Score: '42%',
    Participants: 48,
  },
  {
    'UX projects': 'Benefits and Credits - UX and web content improvements',
    Test: 'Baseline',
    Date: '07/2020',
    Score: '83%',
    Participants: 40,
  },
  {
    'UX projects': 'CEWS web pages test',
    Test: 'Baseline',
    Date: '07/2020',
    Score: '55%',
    Participants: 40,
  },
  {
    'UX projects': 'CEWS Spreadsheet',
    Test: 'Baseline',
    Date: '06/2020',
    Score: '15%',
    Participants: 20,
  },
  {
    'UX projects': 'CERB 2.0 Repayment  - exploratory (after widget launch)',
    Test: 'Exploratory',
    Date: '05/2020',
    Score: '43%',
    Participants: 40,
  },
  {
    'UX projects': 'CERB 2.0 Repayment  - baseline (before widget launch)',
    Test: 'Baseline',
    Date: '05/2020',
    Score: '45%',
    Participants: 40,
  },
  {
    'UX projects': 'Contact the CRA',
    Test: 'Validation',
    Date: '01/2019',
    Score: '62%',
    Participants: 120,
  },
  {
    'UX projects': 'Canada Child Benefit (CCB)',
    Test: 'Validation',
    Date: '01/2019',
    Score: '78%',
    Participants: 0,
  },
  {
    'UX projects': 'GST/HST and Payroll',
    Test: 'Validation',
    Date: '01/2018',
    Score: '62%',
    Participants: 0,
  },
];
