import { Component, OnInit } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { ColumnConfig } from '@dua-upd/upd-components';

import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { GetTableProps } from '@dua-upd/utils-common';

@Component({
  selector: 'upd-pages-details-readability',
  templateUrl: './pages-details-readability.component.html',
  styleUrls: ['./pages-details-readability.component.css'],
})
export class PagesDetailsReadabilityComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  totalScore$ = 74.8;
  readability$ = 37.52;
  fleshKincaid$ = 6;
  heading$ = 17.27;
  wordsPerHeading$ = 61.80;
  paragraph$ = 20.00;
  wordsPerParagraph$ = 19.31;
  mostFrequentWordsOnPage$ = [{word: 'rent', count: '6'}, {word: 'wage', count: '7'}, {word: 'cers', count: '5'}];
  wordCount$ = 309;
  paragraphCount$ = 16;
  headingCount$ = 5;
  originalFleschKincaidScore$ = 19.92;

  mostFrequentWordsOnPageCols: ColumnConfig[] = [];

  totalScoreKpiConfig = {
    pass: { message: '' },
    partial: { message: '' },
    fail: { message: '' },
  };

  readabilityKpiConfig = {
    pass: { message: '' },
    partial: { message: '' },
    fail: { message: '' },
  };

  totalScoreKpiCriteria = (totalScore: number) => {
    switch (true) {
      case totalScore === 0:
        return 'none';
      case totalScore >= 90:
        this.totalScoreKpiConfig.pass.message = 'kpi-90-or-more';
        return 'pass';
      case totalScore >= 80 && totalScore < 90:
        this.totalScoreKpiConfig.pass.message = 'kpi-80-and-90';
        return 'pass';
      case totalScore >= 70 && totalScore < 80:
        this.totalScoreKpiConfig.pass.message = 'kpi-70-and-80';
        return 'pass';
      case totalScore >= 60 && totalScore < 70:
        this.totalScoreKpiConfig.partial.message = 'kpi-60-and-70';
        return 'partial';
      case totalScore >= 50 && totalScore < 60:
        this.totalScoreKpiConfig.fail.message = 'kpi-50-and-60';
        return 'fail';
      case totalScore < 50:
        this.totalScoreKpiConfig.fail.message = 'kpi-50-or-under';
        return 'fail';
      default:
        return 'none';
    }
  };

  readabilityKpiCriteria = () => {
    switch (true) {
      case this.fleshKincaid$ === 0:
        return 'none';
      case this.fleshKincaid$ <= 9:
        this.readabilityKpiConfig.pass.message = 'flesch-kincaid-readability-score';
        return 'pass';
      case this.fleshKincaid$ > 9 && this.fleshKincaid$ <= 11:
        this.readabilityKpiConfig.partial.message = 'flesch-kincaid-readability-score';
        return 'partial';
      case this.fleshKincaid$ > 11:
        this.readabilityKpiConfig.fail.message = 'flesch-kincaid-readability-score';
        return 'fail';
      default:
        return 'none';
    }
  };

  constructor(
    private pageDetailsService: PagesDetailsFacade,
    private i18n: I18nFacade
  ) {}

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    this.currentLang$.subscribe((lang) => {

      this.mostFrequentWordsOnPageCols = [
        {
          field: 'word',
          header: this.i18n.service.translate('word', lang),
        },
        {
          field: 'count',
          header: this.i18n.service.translate('count', lang),
        },
      ];

    });
  }
}
