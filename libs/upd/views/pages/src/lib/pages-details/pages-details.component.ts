import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PagesDetailsFacade } from './+state/pages-details.facade';
import type { ColumnConfig } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { combineLatest, filter, map, startWith } from 'rxjs';
import { EN_CA } from '@dua-upd/upd/i18n';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'upd-page-details',
  templateUrl: './pages-details.component.html',
  styleUrls: ['./pages-details.component.css'],
})
export class PagesDetailsComponent implements OnInit {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);
  private router = inject(Router);

  title$ = this.pageDetailsService.pageTitle$;
  url$ = this.pageDetailsService.pageUrl$;
  pageStatus$ = this.pageDetailsService.pageStatus$;
  loading$ = this.pageDetailsService.loading$;
  showUrl = true;
  showAlert = false;
  altPageId = toSignal(this.pageDetailsService.altPageId$) as () => string;
  currentLang = this.i18n.currentLang;
  langLink = 'en';
  navTabs: { href: string; title: string }[] = [];
  projects$ = this.pageDetailsService.projects$;
  projectsCol: ColumnConfig = { field: '', header: '' };

  currentRoute$ = this.pageDetailsService.currentRoute$;
  currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() =>
        this.router.url.substring(this.router.url.lastIndexOf('/') + 1),
      ),
      startWith(
        this.router.url.substring(this.router.url.lastIndexOf('/') + 1),
      ),
    ),
  ) as () => string;

  navigateToAltPage() {
    window.location.href = `/${this.currentLang() === 'en-CA' ? 'en' : 'fr'}/pages/${this.altPageId()}/${this.currentUrl()}`;
  }

  ngOnInit(): void {
    this.pageDetailsService.init();

    this.navTabs = [
      {
        href: 'summary',
        title: this.i18n.service.translate('tab-summary', this.currentLang()),
      },
      {
        href: 'webtraffic',
        title: this.i18n.service.translate(
          'tab-webtraffic',
          this.currentLang(),
        ),
      },
      {
        href: 'searchanalytics',
        title: this.i18n.service.translate(
          'tab-searchanalytics',
          this.currentLang(),
        ),
      },
      {
        href: 'pagefeedback',
        title: this.i18n.service.translate(
          'tab-pagefeedback',
          this.currentLang(),
        ),
      },
      {
        href: 'flow',
        title: this.i18n.service.translate('tab-flow', this.currentLang()),
      },
      {
        href: 'readability',
        title: this.i18n.service.translate(
          'tab-readability',
          this.currentLang(),
        ),
      },
      {
        href: 'version-history',
        title: this.i18n.service.translate(
          'tab-version-history',
          this.currentLang(),
        ),
      },
      // { href: 'details', title: this.i18n.service.translate('tab-details', lang) },
    ];

    this.projectsCol = {
      field: 'title',
      header: 'project',
      type: 'link',
      typeParams: {
        preLink: '/' + this.langLink + '/projects',
        link: 'id',
      },
    } as ColumnConfig;
  }

  toggleUrl() {
    this.showUrl = !this.showUrl;
  }

  toggleAlert() {
    this.showAlert = !this.showAlert;
  }
}
