import { Component, computed, inject, signal, Signal } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import type { GetTableProps } from '@dua-upd/utils-common';
import { PagesDetailsFacade } from '../+state/pages-details.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import dayjs from 'dayjs';
import { DropdownOption } from '@dua-upd/upd-components';

interface UrlHash {
  hash: string;
  date: Date;
  blob: string;
}

@Component({
  selector: 'upd-page-details-versions',
  templateUrl: './pages-details-versions.component.html',
  styleUrls: ['./pages-details-versions.component.css'],
})
export class PagesDetailsVersionsComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

  currentLang = this.i18n.currentLang();

  data$ = this.pageDetailsService.pagesDetailsData$;
  error$ = this.pageDetailsService.error$;
  hashes = toSignal(this.pageDetailsService.hashes$) as () => UrlHash[];
  url = toSignal(this.pageDetailsService.pageUrl$) as () => string;
}
