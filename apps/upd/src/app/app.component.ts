import { Component, OnInit } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { EN_CA } from '@dua-upd/upd/i18n';
import {
  animate,
  group,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { ChildrenOutletContexts } from '@angular/router';

export const fader =
  trigger('routeAnimations', [
    transition('* <=> *', [
      group([
        // Set a default  style for enter and leave
        query(':enter, :leave', [
          style({
            position: 'absolute',
            left: 0,
            width: '100%',
            opacity: 0,
          }),
        ], { optional: true }),
        query(':enter', [
          style({
            transform: 'translateY(66%)',
          }),
          animate('400ms cubic-bezier(.89,-0.61,.66,.99)', style({ opacity: 1, transform: 'translateY(0)' })),
        ], { optional: true }),
      ])
    ]),
  ]);

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

  constructor(
    private i18n: I18nFacade,
    private contexts: ChildrenOutletContexts
  ) {}

  ngOnInit() {
    // dispatch init event to set lang from state
    this.i18n.init();
    this.currentLang$.subscribe((lang) => {
      this.title = this.i18n.service.translate('app.title', lang);
    });
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
