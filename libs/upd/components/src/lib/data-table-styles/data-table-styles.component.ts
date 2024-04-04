import { Component, inject, Input, OnInit } from '@angular/core';
import type { ColumnConfig } from '@dua-upd/types-common';
import { PercentPipe, DecimalPipe, DatePipe } from '@angular/common';
import { PageStatus, ProjectStatus } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { SecondsToMinutesPipe } from '@dua-upd/upd/pipes';

@Component({
  selector: 'upd-data-table-styles',
  templateUrl: './data-table-styles.component.html',
  styleUrls: ['./data-table-styles.component.scss'],
  providers: [PercentPipe, DecimalPipe, DatePipe],
})
export class DataTableStylesComponent implements OnInit {
  private percentPipe = inject(PercentPipe);
  private decimalPipe = inject(DecimalPipe);
  private datePipe = inject(DatePipe);
  private secondsToMinutesPipe = inject(SecondsToMinutesPipe);
  public i18n = inject(I18nFacade);

  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string> = {};

  array: string[] = [];
  labelType?: 'project' | 'page';
  numberVal: number | string = 0;

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

  comparisonClassMap(field: string, upGoodDownBad = true) {
    const value = this.data[field] as number;

    if (upGoodDownBad) {
      return {
        'text-danger': value < 0,
        'text-success': value > 0,
      };
    }

    return {
      'text-danger': value > 0,
      'text-success': value < 0,
    };
  }

  arrowMap(field: string) {
    const value = this.data[field] as number;
    if (value < 0) {
      return 'arrow_downward';
    } else if (value > 0) {
      return 'arrow_upward';
    }
    return '';
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
      case 'secondsToMinutes':
        return this.secondsToMinutesPipe.transform(data) || '';
      default:
        return data;
    }
  }

  get currentLang() {
    return this.i18n.service.currentLang;
  }
}
