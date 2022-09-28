import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ColumnConfig, ColumnConfigPipe } from './types';
import { PercentPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ProjectStatus } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';

@Component({
  selector: 'upd-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
  providers: [PercentPipe, DecimalPipe, DatePipe],
})
export class DataTableStylesComponent implements OnInit, OnChanges {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() href = '';
  @Input() data: Record<string, number | string> = {};

  numberVal: number | string = 0;

  isProjectLabel = false;
  projectLabel: ProjectStatus = 'Unknown';
  hasType = false;
  hasPipe = false;

  comparisonClassMap = {
    'text-danger': this.data[this.config.field] < 0,
    'text-success': this.data[this.config.field] > 0,
  };

  ngOnInit() {
    this.hasType = !!this.config.type;
    this.hasPipe = !!this.config.pipe;

    if (this.hasPipe) {
      this.numberVal =
        this.configurePipe(
          this.data[this.config.field] as number,
          this.config.pipe,
          this.config.pipeParam
        ) || '';
    }

    if (this.config.type === 'label' && this.config.typeParam !== 'cops')
      this.isProjectLabel = true;

    this.projectLabel = this.data[this.config.field] as ProjectStatus;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.comparisonClassMap = {
        'text-danger': this.data[this.config.field] < 0,
        'text-success': this.data[this.config.field] > 0,
      };
    }
  }

  configurePipe(data: number, pipe?: ColumnConfigPipe, pipeParam?: string) {
    if (pipe === 'number') {
      return this.decimalPipe.transform(data, pipeParam, this.currentLang);
    } else if (pipe === 'percent') {
      return this.percentPipe.transform(data, pipeParam, this.currentLang);
    } else if (pipe === 'date') {
      return this.datePipe.transform(data, pipeParam, 'UTC', this.currentLang);
    }

    return data;
  }

  get currentLang() {
    return this.i18n.service.currentLang;
  }

  constructor(
    private percentPipe: PercentPipe,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private i18n: I18nFacade
  ) {}
}
