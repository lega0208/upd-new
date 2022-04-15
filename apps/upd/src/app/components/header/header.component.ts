import { Component, Input } from '@angular/core';
import { LocaleId, EN_CA, FR_CA } from '@cra-arc/upd/i18n';
import { I18nFacade } from '@cra-arc/upd/state';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() lang = EN_CA;
  en = EN_CA;
  fr = FR_CA;

  constructor(private i18n: I18nFacade) {}

  selectLanguage(value: string) {
    this.i18n.setLang(value as LocaleId);
  }
}
