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

  pageLastUpdated$ = this.pageDetailsService.pageLastUpdated$;
  totalScore$ = this.pageDetailsService.totalScore$;
  readabilityPoints$ = this.pageDetailsService.readabilityPoints$;
  fleshKincaid$ = this.pageDetailsService.fleshKincaid$;
  headingPoints$ = this.pageDetailsService.headingPoints$;
  wordsPerHeading$ = this.pageDetailsService.wordsPerHeading$;
  paragraphPoints$ = this.pageDetailsService.paragraphPoints$;
  wordsPerParagraph$ = this.pageDetailsService.wordsPerParagraph$;
  mostFrequentWordsOnPage$ = this.pageDetailsService.mostFrequentWordsOnPage$;
  wordCount$ = this.pageDetailsService.wordCount$;
  paragraphCount$ = this.pageDetailsService.paragraphCount$;
  headingCount$ = this.pageDetailsService.headingCount$;
  originalFleschKincaidScore$ = this.pageDetailsService.originalFleschKincaidScore$;

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

  readabilityKpiCriteria = (fleshKincaid: number) => {
    switch (true) {
      case fleshKincaid === 0:
        return 'none';
      case fleshKincaid <= 9:
        this.readabilityKpiConfig.pass.message = 'flesch-kincaid-readability-score';
        return 'pass';
      case fleshKincaid > 9 && fleshKincaid <= 11:
        this.readabilityKpiConfig.partial.message = 'flesch-kincaid-readability-score';
        return 'partial';
      case fleshKincaid > 11:
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
