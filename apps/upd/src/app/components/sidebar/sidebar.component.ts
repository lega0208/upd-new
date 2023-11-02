import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nFacade } from '@dua-upd/upd/state';
import { map } from 'rxjs';
import { FR_CA } from '@dua-upd/upd/i18n';
import updLogoEn from '../../../assets/img/upd-logo.png';
import updLogoFr from '../../../assets/img/upd-logo-fr.png';

@Component({
  selector: 'upd-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  i18n = inject(I18nFacade);

  isFr = toSignal(this.i18n.currentLang$.pipe(map((lang) => lang === FR_CA)), {
    initialValue: false,
  });

  updLogo = computed(() => (this.isFr() ? updLogoFr : updLogoEn) as string);

  langPath = computed(() => (this.isFr() ? 'fr' : 'en'));
}
