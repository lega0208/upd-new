import { Component } from '@angular/core';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { ColumnConfig } from '@cra-arc/upd-components';

import { EN_CA, LocaleId } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';
import { combineLatest } from 'rxjs';


@Component({
  selector: 'app-page-details-webtraffic',
  templateUrl: './pages-details-webtraffic.component.html',
  styleUrls: ['./pages-details-webtraffic.component.css'],
})
export class PagesDetailsWebtrafficComponent {
  currentLang!: LocaleId;
  currentLang$ = this.i18n.currentLang$;

  visitsByDay$ = this.pageDetailsService.visitsByDay$;

  whereVisitorsCameFrom$ = this.pageDetailsService.topSearchTermsIncrease$;
  // whereVisitorsCameFromCols = [
  //   { field: 'url', header: 'Previous page URL' },
  //   { field: 'visits', header: 'Visits' },
  //   { field: 'change', header: 'Comparison' },
  // ] as ColumnConfig[];

  whatVisitorsClickedOn$ = this.pageDetailsService.topSearchTermsIncrease$;
  // whatVisitorsClickedOnCols = [
  //   { field: 'text', header: 'Text' },
  //   { field: 'clicks', header: 'Clicks' },
  //   { field: 'change', header: 'Comparison' },
  // ] as ColumnConfig[];

  visitorLocation$ = this.pageDetailsService.visitorLocation$;
  // visitorLocationCols = [
  //   { field: 'province', header: 'Province' },
  //   { field: 'value', header: 'Visits', pipe: 'number' },
  //   { field: 'change', header: 'Comparison' },
  // ] as ColumnConfig[];

  constructor(private pageDetailsService: PagesDetailsFacade, private i18n: I18nFacade) {}

  visitorLocationCols: ColumnConfig[] = [];
  whatVisitorsClickedOnCols: ColumnConfig[] = []; 
  whereVisitorsCameFromCols: ColumnConfig[] = [];

  ngOnInit() {
    this.i18n.service.onLangChange(({ lang }) => {
      this.currentLang = lang as LocaleId;
    });

    combineLatest([
      this.currentLang$
    ]).subscribe(([lang]) => {
      this.visitorLocationCols = [
        { field: 'province', header: this.i18n.service.translate('province', lang) },
        { field: 'value', header: this.i18n.service.translate('visits', lang), pipe: 'number' },
        { field: 'change', header: this.i18n.service.translate('comparison', lang) },
      ],
      this.whatVisitorsClickedOnCols = [
        { field: 'text', header: this.i18n.service.translate('text', lang) },
        { field: 'clicks', header: this.i18n.service.translate('clicks', lang) },
        { field: 'change', header: this.i18n.service.translate('comparison', lang) },
      ],
      this.whereVisitorsCameFromCols = [
        { field: 'url', header: this.i18n.service.translate('previous-page-url', lang) },
        { field: 'visits', header: this.i18n.service.translate('visits', lang) },
        { field: 'change', header: this.i18n.service.translate('comparison', lang) },
      ];
    });
  }
}
