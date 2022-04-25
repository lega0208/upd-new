import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { formatNumber, formatPercent } from '@angular/common';
import { combineLatest, map, of } from 'rxjs';
import { I18nFacade } from '@cra-arc/upd/state';
import { EN_CA } from '@cra-arc/upd/i18n';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent implements OnInit, OnChanges {
  @Input() current$ = of(0);
  @Input() comparison$ = of(0);
  @Input() date!: Date | string;
  @Input() numUxTests = 0;
  @Input() title = '';
  @Input() tooltip = '';
  @Input() pipe: 'percent' | 'number' = 'number';
  @Input() pipeParams?: string;

  EN_CA = EN_CA;

  currentLang$ = this.i18n.currentLang$;

  currentFormatted$ = combineLatest([this.currentLang$, this.current$]).pipe(
    map(([lang, current]) => {
      console.log(current);
      if (this.pipe === 'percent') {
        return formatPercent(current, lang, this.pipeParams);
      }
      return formatNumber(current, lang, this.pipeParams);
    })
  );

  comparisonFormatted$ = combineLatest([
    this.currentLang$,
    this.comparison$,
  ]).pipe(map(([lang, comparison]) => formatPercent(comparison, lang)));

  comparisonClass = 'hidden';

  constructor(private i18n: I18nFacade) {}

  ngOnInit() {
    this.comparison$.subscribe((comparison) => {
      if (comparison > 0) {
        this.comparisonClass = 'text-success';
      } else if (comparison < 0) {
        this.comparisonClass = 'text-danger';
      } else {
        this.comparisonClass = 'hidden';
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['current$']) {
      this.currentFormatted$ = combineLatest([
        this.currentLang$,
        this.current$,
      ]).pipe(
        map(([lang, current]) => {
          if (this.pipe === 'percent') {
            return formatPercent(current, lang, this.pipeParams);
          }
          return formatNumber(current, lang, this.pipeParams);
        })
      );
    }

    if (changes['comparison$']) {
      this.comparisonFormatted$ = combineLatest([
        this.currentLang$,
        this.comparison$,
      ]).pipe(map(([lang, comparison]) => formatPercent(comparison, lang)));
    }
  }
}
