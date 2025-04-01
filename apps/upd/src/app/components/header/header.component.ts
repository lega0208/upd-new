import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EN_CA, FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { map } from 'rxjs';

@Component({
  selector: 'upd-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private i18n: I18nFacade = inject(I18nFacade);

  lang = this.i18n.currentLang;
  craLogo = '../../../assets/img/CRA-FIP-9pt-e.png';

  oppositeLang = computed(() => {
    if (!this.lang()) return null;

    return this.lang() === FR_CA ? EN_CA : FR_CA;
  });

  selectLanguage(value: LocaleId | null) {
    if (!value) return;

    this.i18n.setLang(value);
  }

  isFr = toSignal(this.i18n.currentLang$.pipe(map((lang) => lang === FR_CA)), {
    initialValue: false,
  });

  langPath = computed(() => (this.isFr() ? 'fr' : 'en'));
}
