import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { ChildrenOutletContexts } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';
import { PrimeNGConfig, Translation } from 'primeng/api';
import { fader } from './app.animations';
import packageJson from 'package.json';
import canadaLogo from '../assets/img/canada-black-30mm.png';

@Component({
  selector: 'upd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fader],
})
export class AppComponent implements OnInit {
  i18n = inject(I18nFacade);
  contexts = inject(ChildrenOutletContexts);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  titleService = inject(Title);
  primeNgConfig = inject(PrimeNGConfig);

  primeNgConfigSignal = toSignal(this.i18n.service.observeKey('primeng'));

  currentLang = this.i18n.service.langSignal;

  titleFromNavigation = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      filter((route: ActivatedRoute) => route.outlet === 'primary'),
      mergeMap((route: ActivatedRoute) => route.data),
      map((data): string => data['title'] ?? 'Usability Performance Dashboard'),
    ),
  );

  translatedTitleFromNav = computed(() => {
    const currentTitle = this.titleFromNavigation();

    const translatedTitle = this.i18n.service.instant(
      currentTitle || this.title,
    );

    return translatedTitle;
  });

  en = EN_CA;
  title = 'Usability Performance Dashboard';
  updVersion = packageJson.version;
  canadaLogo = canadaLogo;

  constructor() {
    effect(() => {
      this.title = this.translatedTitleFromNav();

      this.titleService.setTitle(this.translatedTitleFromNav());
    });

    effect(() =>
      this.primeNgConfig.setTranslation(
        this.primeNgConfigSignal() as Translation,
      ),
    );
  }

  ngOnInit() {
    this.i18n.init();
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
