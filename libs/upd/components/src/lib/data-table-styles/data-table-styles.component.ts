import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig, ColumnConfigPipe } from './types';
import { PercentPipe, DecimalPipe, DatePipe } from '@angular/common';
import { I18nService } from '@cra-arc/upd/i18n';
import { ProjectStatus } from '@cra-arc/types-common';


@Component({
  selector: 'app-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
  providers: [PercentPipe, DecimalPipe, DatePipe],
})
export class DataTableStylesComponent implements OnInit {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() href: string = '';
  @Input() data: Record<string, number | string> = {};

  numberVal: number | string = 0;

  isProjectLabel = this.config.type === 'label' && this.config.typeParam !== 'cops';
  projectLabel = this.data[this.config.field] as ProjectStatus
  hasType = false;
  hasPipe = false;

  ngOnInit() {
    this.hasType = !!this.config.type;
    this.hasPipe = !!this.config.pipe;

    if (this.hasPipe) {
      this.numberVal = this.configurePipe(
        this.data[this.config.field] as number,
        this.config.pipe,
        this.config.pipeParam
      ) || '';
    }
  }

  configurePipe(data: number, pipe?: ColumnConfigPipe, pipeParam?: string) {
    if (pipe === 'number') {
      return this.decimalPipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      );
    } else if (pipe === 'percent') {
      return this.percentPipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      );
    } else if (pipe === 'date') {
      return this.datePipe.transform(
        data,
        pipeParam,
        this.i18n.currentLang
      );
    }

    return data;
  }

  constructor(
    private percentPipe: PercentPipe,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private i18n: I18nService
  ) {}
}
