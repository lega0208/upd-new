import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'rxjs/operators';
import { PagesDetailsFacade } from '../+state/pages-details.facade';

import { ColumnConfig } from '@cra-arc/upd-components';
import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-page-details-feedback',
  templateUrl: './pages-details-feedback.component.html',
  styleUrls: ['./pages-details-feedback.component.css'],
})
export class PagesDetailsFeedbackComponent implements OnInit {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  dyfChart$ = this.pageDetailsService.dyfData$;
  whatWasWrongChart$ = this.pageDetailsService.whatWasWrongData$;

  constructor(
    private pageDetailsService: PagesDetailsFacade,
    private i18n: I18nFacade
  ) {}

  dyfTableCols: ColumnConfig[] = [];
  whatWasWrongTableCols: ColumnConfig[] = [];

  ngOnInit(): void {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([this.currentLang$]).subscribe(([lang]) => {
      this.dyfTableCols = [
        {
          field: 'name',
          header: this.i18n.service.translate('Selection', lang),
        },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
      this.whatWasWrongTableCols = [
        { field: 'name', header: this.i18n.service.translate('d3-www', lang) },
        {
          field: 'value',
          header: this.i18n.service.translate('visits', lang),
          pipe: 'number',
        },
      ];
    });
  }
}
