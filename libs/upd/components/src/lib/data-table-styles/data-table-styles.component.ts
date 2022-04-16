import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig } from './types';
import { PercentPipe, DecimalPipe, DatePipe } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr-CA';
import { stringify } from 'querystring';
import { I18nService } from '@cra-arc/upd/i18n';

registerLocaleData(localeFr, 'fr-CA');

@Component({
  selector: 'app-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
  providers: [PercentPipe, DecimalPipe, DatePipe],
})
export class DataTableStylesComponent implements OnInit {
  @Input() config!: ColumnConfig;
  @Input() href: string = '';
  @Input() data: any;
  @Input() hasData = false;

  hasType = false;
  hasPipe = false;

  numberVal: number = 0;

  ngOnInit(): void {
    this.hasType = this.config.hasOwnProperty('type');
    this.hasPipe = this.config.hasOwnProperty('pipe');

    if (this.hasPipe) {
      this.numberVal = this.configurePipe(
        this.data[this.config.field],
        this.config.pipe,
        this.config.pipeParam || ''
      );
    }
  }

  configurePipe(data: string, pipe: any, pipeParam: string): number {
    let numberVal = 0;
    if (pipe === 'number') {
      numberVal = this.decimalPipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      ) as unknown as number;
    } else if (pipe === 'percent') {
      numberVal = this.percentPipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      ) as unknown as number;
    } else if (pipe === 'date') {
      numberVal = this.datePipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      ) as unknown as number;
    }

    return numberVal;
  }

  constructor(
    private percentPipe: PercentPipe,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private i18n: I18nService
  ) {}
}
