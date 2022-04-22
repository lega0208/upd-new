import { Component } from '@angular/core';
import { I18nFacade } from '@cra-arc/upd/state';
import { map } from 'rxjs';
import { FR_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  isFr$ = this.i18n.currentLang$.pipe(map(lang => lang === FR_CA));
  langPath = this.isFr$.pipe(map((isFr) => isFr ? 'fr' : 'en'));

  constructor(private i18n: I18nFacade) {}
}
