import { Component, OnInit } from '@angular/core';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  currentLang$ = this.i18n.currentLang$;
  en = EN_CA;
  title = 'Usability Performance Dashboard';

  constructor(private i18n: I18nFacade) {}

  ngOnInit() {
    // dispatch init event to set lang from state
    this.i18n.init();
    this.currentLang$.subscribe((lang) => {
      this.title = this.i18n.service.translate('app.title', lang);
    })
  }
}
