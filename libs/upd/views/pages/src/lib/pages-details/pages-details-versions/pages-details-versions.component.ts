import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
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
export class PagesDetailsVersionsComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);

  currentLang = this.i18n.currentLang();

  data$ = this.pageDetailsService.pagesDetailsData$;
  error$ = this.pageDetailsService.error$;
  hashes = this.pageDetailsService.hashesData;
  url = toSignal(this.pageDetailsService.pageUrl$) as () => string;

  getHashes() {
    this.pageDetailsService.getHashes();
  }

  ngOnInit() {
    this.getHashes();
  }
}
