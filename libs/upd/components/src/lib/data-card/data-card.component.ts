import { Component, Input } from '@angular/core';
import { I18nFacade } from '@cra-arc/upd/state';
import { map } from 'rxjs';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent {
  @Input() current: string | number = 0;
  @Input() comparison = 0;
  @Input() date!: Date | string;
  @Input() numUxTests = 0;
  @Input() title = '';
  @Input() tooltip = '';
  currentLang$ = this.i18n.currentLang$;

  current$ = this.currentLang$.pipe(
    map((lang) => this.current.toLocaleString(lang))
  );

  constructor(public i18n: I18nFacade) {}
}
