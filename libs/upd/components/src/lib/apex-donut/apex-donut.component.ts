import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ChartComponent,
} from 'ng-apexcharts';
import { ColumnConfig } from '../data-table-styles/types';
import { I18nFacade } from '@dua-upd/upd/state';
import { ApexStore } from './apex.store';

@Component({
  selector: 'upd-apex-donut',
  templateUrl: './apex-donut.component.html',
  styleUrls: ['./apex-donut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApexStore],
})
export class ApexDonutComponent implements OnInit {
  @ViewChild('chart', { static: true }) chart!: ChartComponent;
  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() table: any;
  @Input() tableCols: ColumnConfig[] = [];

  @Input() set colours(value: string[]) {
    this.apexStore.setColours(value);
  }

  @Input() set series(value: ApexNonAxisChartSeries) {
    this.apexStore.setSeries(value);
  }

  get series() {
    return this.series;
  }

  @Input() set labels(value: string[]) {
    this.apexStore.setLabels(value);
  }

  readonly vm$ = this.apexStore.vm$;

  constructor(
    private i18n: I18nFacade,
    private readonly apexStore: ApexStore
  ) {}

  ngOnInit(): void {
    this.i18n.currentLang$.subscribe((lang) => {
      this.apexStore.setLocale(lang);
    });
  }
}
