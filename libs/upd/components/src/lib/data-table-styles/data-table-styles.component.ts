import { Component, Input, OnInit } from '@angular/core';
import { ColumnConfig, ColumnConfigPipe } from './types';
import { PercentPipe, DecimalPipe, DatePipe } from '@angular/common';
import { PageStatus, ProjectStatus } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';

@Component({
  selector: 'upd-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
  providers: [PercentPipe, DecimalPipe, DatePipe],
})
export class DataTableStylesComponent implements OnInit {
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string> = {};

  array: string[] = [];
  labelType?: 'project' | 'page';
  numberVal: number | string = 0;

  constructor(
    private percentPipe: PercentPipe,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private i18n: I18nFacade,
  ) {}

  ngOnInit() {
    if (this.config.pipe) {
      this.numberVal = this.applyPipe(this.data[this.config.field] as number);
    }

    if (this.config.type === 'label') {
      if (this.config.typeParam === 'status') {
        this.labelType = 'project';
      } else if (this.config.typeParam === 'pageStatus') {
        this.labelType = 'page';
      }
    }
  }

  isArray<T>(obj: T) {
    if (Array.isArray(obj)) {
      this.array = obj;
      return true;
    }
    return false;
  }

  get projectStatus(): ProjectStatus {
    return this.data[this.config.field] as ProjectStatus;
  }

  get pageStatus(): PageStatus {
    return this.data[this.config.field] as PageStatus;
  }

  get comparisonClassMap() {
    const value = this.data[this.config.field] as number;
    return {
      'text-danger': value < 0,
      'text-success': value > 0,
    };
  }

  private applyPipe(data: number): number | string {
    switch (this.config.pipe) {
      case 'number':
        return (
          this.decimalPipe.transform(
            data,
            this.config.pipeParam || undefined,
            this.currentLang,
          ) || ''
        );
      case 'percent':
        return (
          this.percentPipe.transform(
            data,
            this.config.pipeParam || undefined,
            this.currentLang,
          ) || ''
        );
      case 'date':
        return (
          this.datePipe.transform(
            data,
            this.config.pipeParam || undefined,
            'UTC',
            this.currentLang,
          ) || ''
        );
      default:
        return data;
    }
  }

  get currentLang() {
    return this.i18n.service.currentLang;
  }
}
