import { Component, OnInit } from '@angular/core';
import { I18nFacade } from '@cra-arc/upd/state';
import { LocaleId, EN_CA, FR_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  currentLang: LocaleId = EN_CA;
  en = EN_CA;
  fr = FR_CA;

  constructor(private i18n: I18nFacade) {}

  ngOnInit() {
    // dispatch init event to set lang from state
    this.i18n.init();

    // subscribe to lang change to sync local property
    this.i18n.service.onLangChange(
      (newLang) => (this.currentLang = newLang.lang as LocaleId)
    );
  }
}
