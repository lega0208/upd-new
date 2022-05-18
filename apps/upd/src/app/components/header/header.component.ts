import { Component, Input } from '@angular/core';
import { LocaleId, EN_CA, FR_CA } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';

@Component({
  selector: 'upd-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() lang = EN_CA;

  constructor(private i18n: I18nFacade) {}

  get oppositeLang() {
    return this.lang === EN_CA ? FR_CA : EN_CA;
  }

  selectLanguage(value: string) {
    this.i18n.setLang(value as LocaleId);
  }
}
