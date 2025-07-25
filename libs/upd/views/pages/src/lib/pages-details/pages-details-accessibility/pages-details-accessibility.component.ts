import { Component, inject } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'upd-pages-details-accessibility',
    templateUrl: './pages-details-accessibility.component.html',
    styleUrls: ['./pages-details-accessibility.component.css'],
    standalone: false
})
export class PagesDetailsAccessibilityComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

  currentLang$ = this.i18n.currentLang$;
  pageUrl = toSignal(this.pageDetailsService.pageUrl$);
  currentLang = toSignal(this.currentLang$);
}
