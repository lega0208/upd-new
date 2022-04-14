import { Component } from '@angular/core';
import { I18nService, LocaleId } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  constructor(private i18n: I18nService) {}

  selectLanguage(value: string){
    this.i18n.use(value as LocaleId)
  }
}
