import { Component, inject } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { I18nFacade } from '@dua-upd/upd/state';
import type {
  KpiObjectiveCriteria,
  KpiOptionalConfig,
} from '@dua-upd/upd-components';
import type { ColumnConfig } from '@dua-upd/types-common';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { formatNumber } from '@angular/common';

@Component({
  selector: 'upd-pages-details-readability',
  templateUrl: './pages-details-readability.component.html',
  styleUrls: ['./pages-details-readability.component.css'],
})
export class PagesDetailsReadabilityComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

  currentLang$ = this.i18n.currentLang$;

  pageLang$ = this.pageDetailsService.pageLang$;
  // Flesch-Kincaid vs. Kandel-Moles
  readabilityDescriptionKey$ = this.pageLang$.pipe(
    map((lang) =>
      lang === 'fr'
        ? 'calculation-of-readability-points-description-fr'
        : 'calculation-of-readability-points-description',
    ),
  );

  pageLastUpdated$ = this.pageDetailsService.pageLastUpdated$;
  totalScore$ = this.pageDetailsService.totalScore$;
  readabilityPoints$ = this.pageDetailsService.readabilityPoints$;
  fleshKincaid$ = this.pageDetailsService.fleshKincaid$;
  headingPoints$ = this.pageDetailsService.headingPoints$;
  wordsPerHeading$ = this.pageDetailsService.wordsPerHeading$;
  paragraphPoints$ = this.pageDetailsService.paragraphPoints$;
  wordsPerParagraph$ = this.pageDetailsService.wordsPerParagraph$;
  mostFrequentWordsOnPage$ =
    this.pageDetailsService.mostFrequentWordsOnPage$.pipe(
      map((words) => [...words]),
    );
  wordCount$ = this.pageDetailsService.wordCount$;
  paragraphCount$ = this.pageDetailsService.paragraphCount$;
  headingCount$ = this.pageDetailsService.headingCount$;

  fleshKincaidFormatted$ = combineLatest([
    this.fleshKincaid$,
    this.currentLang$,
  ]).pipe(
    map(([fleshKincaid, lang]) => {
      const message = this.i18n.service.translate(
        'flesch-kincaid-readability-score',
        lang,
      );
      const value = formatNumber(fleshKincaid, lang, '1.0-2');

      return `${message} ${value}`;
    }),
  );

  wordsPerHeadingFormatted$ = combineLatest([
    this.wordsPerHeading$,
    this.currentLang$,
  ]).pipe(
    map(([wordsPerHeading, lang]) => {
      const message = this.i18n.service.translate(
        'words-between-each-heading',
        lang,
      );
      const value = formatNumber(wordsPerHeading, lang, '1.0-2');

      return `${message} ${value}`;
    }),
  );

  wordsPerParagraphFormatted$ = combineLatest([
    this.wordsPerParagraph$,
    this.currentLang$,
  ]).pipe(
    map(([wordsPerParagraph, lang]) => {
      const message = this.i18n.service.translate('words-per-paragraph', lang);
      const value = formatNumber(wordsPerParagraph, lang, '1.0-2');

      return `${message} ${value}`;
    }),
  );

  mostFrequentWordsOnPageCols$ = this.currentLang$.pipe(
    map(
      (lang) =>
        [
          {
            field: 'word',
            header: this.i18n.service.translate('word', lang),
            headerClass: 'col-3',
          },
          {
            field: 'count',
            header: this.i18n.service.translate('count', lang),
            headerClass: 'col-auto',
          },
        ] as ColumnConfig<{ word: string; count: number }>[],
    ),
  );

  totalScoreTemplateParams = ['{{}}/100', '1.0-2'];
  readabilityScoreTemplateParams = ['{{}}/60', '1.0-2'];
  otherScoresTemplateParams = ['{{}}/20', '1.0-2'];

  totalScoreKpiConfig$: Observable<KpiOptionalConfig> = combineLatest([
    this.totalScore$,
    this.currentLang$,
  ]).pipe(
    map(([totalScore]) => {
      const messageFromScore = (score: number) => {
        switch (true) {
          case score >= 90:
            return 'kpi-90-or-more';
          case score >= 80 && score < 90:
            return 'kpi-80-and-90';
          case score >= 70 && score < 80:
            return 'kpi-70-and-80';
          case score >= 60 && score < 70:
            return 'kpi-60-and-70';
          case score >= 50 && score < 60:
            return 'kpi-50-and-60';
          case score < 50:
            return 'kpi-50-or-under';
          default:
            return '';
        }
      };

      const messageFormatter = () =>
        this.i18n.service.instant(messageFromScore(totalScore));

      return {
        pass: { messageFormatter },
        partial: { messageFormatter },
        fail: { messageFormatter },
      };
    }),
  );

  totalScoreKpiCriteria: KpiObjectiveCriteria = (totalScore: number) => {
    switch (true) {
      case totalScore >= 70:
        return 'pass';
      case totalScore >= 60 && totalScore < 70:
        return 'partial';
      case totalScore < 60:
        return 'fail';
      default:
        return 'none';
    }
  };
}
