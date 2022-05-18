import { Component } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { map } from 'rxjs';
import { FR_CA } from '@dua-upd/upd/i18n';

@Component({
  selector: 'upd-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  isFr$ = this.i18n.currentLang$.pipe(map(lang => lang === FR_CA));
  langPath = this.isFr$.pipe(map((isFr) => isFr ? 'fr' : 'en'));

  constructor(private i18n: I18nFacade) {}
}
