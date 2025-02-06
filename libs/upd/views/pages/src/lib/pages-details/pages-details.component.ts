import {
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PagesDetailsFacade } from './+state/pages-details.facade';
import type { ColumnConfig } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { filter, map, startWith } from 'rxjs';
import { EN_CA } from '@dua-upd/upd/i18n';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'upd-page-details',
  templateUrl: './pages-details.component.html',
  styleUrls: ['./pages-details.component.css'],
})
export class PagesDetailsComponent {
  private i18n = inject(I18nFacade);
  private pageDetailsService = inject(PagesDetailsFacade);
  private router = inject(Router);

  constructor() {
    effect(() => {
      this.pageDetailsService.init();
    }, { allowSignalWrites: true });
  }

  title$ = this.pageDetailsService.pageTitle$;
  url$ = this.pageDetailsService.pageUrl$;
  pageStatus$ = this.pageDetailsService.pageStatus$;
  loading$ = this.pageDetailsService.loading$;
  showUrl = true;
  showAlert = false;
  altPageId = toSignal(this.pageDetailsService.altPageId$) as () => string;
  currentLang = this.i18n.currentLang;
  langLink = computed(() => (this.currentLang() === EN_CA ? 'en' : 'fr'));
  projects$ = this.pageDetailsService.projects$;

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
    window.location.href = `/${this.langLink()}/pages/${this.altPageId()}/${this.currentUrl()}`;
  }

  navTabs = computed<{ href: string; title: string }[]>(() => [
    {
      href: 'summary',
      title: this.i18n.service.translate('tab-summary', this.currentLang()),
    },
    {
      href: 'webtraffic',
      title: this.i18n.service.translate('tab-webtraffic', this.currentLang()),
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
      title: this.i18n.service.translate('tab-readability', this.currentLang()),
    },
    {
      href: 'version-history',
      title: this.i18n.service.translate(
        'tab-version-history',
        this.currentLang(),
      ),
    },
  ]);

  projectsCol = computed(() => {
    return {
      field: 'title',
      header: 'project',
      type: 'link',
      typeParams: {
        preLink: '/' + this.langLink() + '/projects',
        link: 'id',
      },
      translate: true,
    } as ColumnConfig;
  });

  toggleUrl() {
    this.showUrl = !this.showUrl;
  }

  toggleAlert() {
    this.showAlert = !this.showAlert;
  }
}
