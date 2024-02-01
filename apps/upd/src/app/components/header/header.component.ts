import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { EN_CA, FR_CA, LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import craLogo from '../../../assets/img/CRA-FIP-9pt-e.png';

@Component({
  selector: 'upd-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private i18n: I18nFacade = inject(I18nFacade);

  lang = this.i18n.currentLang;
  craLogo = craLogo;

  oppositeLang = computed(() => {
    if (!this.lang()) return null;

    return this.lang() === FR_CA ? EN_CA : FR_CA;
  });

  selectLanguage(value: LocaleId | null) {
    if (!value) return;

    this.i18n.setLang(value);
  }
}
