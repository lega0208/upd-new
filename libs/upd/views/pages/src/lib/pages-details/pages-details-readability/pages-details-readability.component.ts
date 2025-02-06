import {
  Component,
  computed,
  effect,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import type {
  KpiObjectiveCriteria,
  KpiOptionalConfig,
  DropdownOption,
} from '@dua-upd/upd-components';
import type { ColumnConfig } from '@dua-upd/types-common';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { formatNumber } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import dayjs from 'dayjs';
import { FR_CA } from '@dua-upd/upd/i18n';

interface SelectedDate {
  date: string;
}

@Component({
  selector: 'upd-pages-details-readability',
  templateUrl: './pages-details-readability.component.html',
  styleUrls: ['./pages-details-readability.component.css'],
})
export class PagesDetailsReadabilityComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

  constructor() {
    effect(
      () => {
        const storedConfig = this.getStoredConfig();

        if (storedConfig) {
          this.selectedDate.set(storedConfig.date);
        } else {
          this.selectedDate.set(this.getInitialSelection());
        }
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      this.storeConfig();
    }, { allowSignalWrites: true });
  }

  currentLang = this.i18n.currentLang;
  dateParams = computed(() => {
    return this.currentLang() == FR_CA ? 'DD MMM YYYY' : 'MMM DD, YYYY';
  });

  url = toSignal(this.pageDetailsService.pageUrl$) as () => string;

  private storeConfig(): void {
    const currentUrl = this.url();
    sessionStorage.setItem(
      `${currentUrl}-readability-config`,
      JSON.stringify(this.readabilityConfig()),
    );
  }

  private getStoredConfig(): SelectedDate | null {
    const currentUrl = this.url();
    
    return currentUrl
      ? JSON.parse(
          sessionStorage.getItem(`${currentUrl}-readability-config`) || 'null',
        )
      : null;
  }

  pageLang = toSignal(this.pageDetailsService.pageLang$);
  // Flesch-Kincaid vs. Kandel-Moles
  readabilityDescriptionKey = computed(() => {
    const pageLang = this.pageLang();
    return pageLang === 'fr'
      ? 'calculation-of-readability-points-description-fr'
      : 'calculation-of-readability-points-description';
  });

  readabilityArray = toSignal(this.pageDetailsService.readability$);
  dropdownOptions: Signal<DropdownOption<string>[]> = computed(() => {
    const dates = this.readabilityArray();

    return (dates ?? []).map(({ date }) => ({
      label: dayjs(date).format(this.dateParams()),
      value: date.toString(),
    }));
  });
  selectedDate: WritableSignal<string | null> = signal(null);

  readabilityConfig: Signal<SelectedDate> = computed(() => ({
    date: this.selectedDate() ?? '',
  }));

  getInitialSelection = computed(() => {
    const availableOptions = this.dropdownOptions();
    const currentDate = this.readabilityConfig()?.date;

    return availableOptions.some((opt) => opt.value === currentDate)
      ? (currentDate ?? '')
      : availableOptions.length > 0
        ? availableOptions[0].value
        : '';
  });

  selectedReadability = computed(() => {
    const data = this.readabilityArray() || [];
    return (
      data.find(
        (r) => r.date.toString() === this.readabilityConfig().date?.toString(),
      ) || data[0]
    );
  });

  readabilityStats = computed(() => {
    const selected = this.selectedReadability();

    return {
      pageLastUpdated: selected?.date || null,
      totalScore: selected?.total_score || null,
      readabilityPoints: selected?.fk_points || null,
      fleshKincaid: selected?.final_fk_score || null,
      headingPoints: selected?.header_points || null,
      wordsPerHeading: selected?.avg_words_per_header || null,
      paragraphPoints: selected?.paragraph_points || null,
      wordsPerParagraph: selected?.avg_words_per_paragraph || null,
      mostFrequentWordsOnPage: selected?.word_counts || [],
      wordCount: selected?.total_words || null,
      paragraphCount: selected?.total_paragraph || null,
      headingCount: selected?.total_headings || null,
    };
  });

  fleshKincaidFormatted = computed(() => {
    const message = this.i18n.service.translate(
      'flesch-kincaid-readability-score',
      this.currentLang(),
    );
    const value = formatNumber(
      this.readabilityStats()?.fleshKincaid ?? 0,
      this.currentLang(),
      '1.0-2',
    );

    return `${message} ${value}`;
  });

  wordsPerHeadingFormatted = computed(() => {
    const message = this.i18n.service.translate(
      'words-between-each-heading',
      this.currentLang(),
    );
    const value = formatNumber(
      this.readabilityStats()?.wordsPerHeading ?? 0,
      this.currentLang(),
      '1.0-2',
    );

    return `${message} ${value}`;
  });

  wordsPerParagraphFormatted = computed(() => {
    const message = this.i18n.service.translate(
      'words-per-paragraph',
      this.currentLang(),
    );
    const value = formatNumber(
      this.readabilityStats()?.wordsPerParagraph ?? 0,
      this.currentLang(),
      '1.0-2',
    );

    return `${message} ${value}`;
  });

  mostFrequentWordsOnPageCols = computed(
    () =>
      [
        {
          field: 'word',
          header: this.i18n.service.translate('word', this.currentLang()),
          headerClass: 'col-3',
        },
        {
          field: 'count',
          header: this.i18n.service.translate('count', this.currentLang()),
          headerClass: 'col-auto',
        },
      ] as ColumnConfig<{ word: string; count: number }>[],
  );

  totalScoreTemplateParams = ['{{}}/100', '1.0-2'];
  readabilityScoreTemplateParams = ['{{}}/60', '1.0-2'];
  otherScoresTemplateParams = ['{{}}/20', '1.0-2'];

  totalScoreKpiConfig: Signal<KpiOptionalConfig> = computed(() => {
    const totalScore = this.readabilityStats()?.totalScore;

    const messageFromScore = (score: number): string => {
      if (score >= 90) return 'kpi-90-or-more';
      if (score >= 80) return 'kpi-80-and-90';
      if (score >= 70) return 'kpi-70-and-80';
      if (score >= 60) return 'kpi-60-and-70';
      if (score >= 50) return 'kpi-50-and-60';
      return 'kpi-50-or-under';
    };

    const messageFormatter = () =>
      this.i18n.service.instant(messageFromScore(totalScore ?? 0));

    return {
      pass: { messageFormatter },
      partial: { messageFormatter },
      fail: { messageFormatter },
    };
  });

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

  updateSelection(date: string): void {
    const select =
      this.readabilityArray()?.find((d) => d.date.toString() === date) || null;
    if (!select) return;

    this.selectedDate.set(select.date.toString());
  }
}
