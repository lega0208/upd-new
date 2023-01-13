import { Component, OnInit } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import { ChildrenOutletContexts } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap, withLatestFrom } from 'rxjs';
import { PrimeNGConfig, Translation } from 'primeng/api';
import { FilterService } from 'primeng/api';
import { fader } from './app.animations';
import packageJson from 'package.json';

@Component({
  selector: 'upd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fader],
})
export class AppComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  en = EN_CA;
  title = 'Usability Performance Dashboard';
  updVersion = packageJson.version;


  constructor(
    private i18n: I18nFacade,
    private contexts: ChildrenOutletContexts,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private primeNgConfig: PrimeNGConfig,
    private filterService: FilterService
  ) {}

  ngOnInit() {
    this.i18n.init();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        filter((route: ActivatedRoute) => route.outlet === 'primary'),
        mergeMap((route: ActivatedRoute) => route.data),
        map(
          (data): string => data['title'] ?? 'Usability Performance Dashboard'
        ),
        withLatestFrom(this.currentLang$)
      )
      .subscribe(([title, lang]) => {
        this.title = this.i18n.service.translate(title, lang);
        this.titleService.setTitle(this.title);
      });

    this.i18n.service
      .observeKey('primeng')
      .subscribe((translations) =>
        this.primeNgConfig.setTranslation(translations as Translation)
      );

    const customEquals = 'custom-equals';

    this.filterService.register(customEquals, (value:unknown, filter: string | null | undefined): boolean => {
        if (filter === undefined || filter === null || filter.trim() === '') {
            return true;
        }

        if (value === undefined || value === null) {
            return false;
        }

        return value.toString() === filter.toString();
    });
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
