import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ApexAxisChartSeries, ChartComponent } from 'ng-apexcharts';
import { ColumnConfig } from '../data-table-styles/types';
import { I18nFacade } from '@dua-upd/upd/state';
import { ApexStore } from './apex.store';

@Component({
  selector: 'upd-apex-bar',
  templateUrl: './apex-bar.component.html',
  styleUrls: ['./apex-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApexStore],
})
export class ApexBarComponent implements OnInit {
  @ViewChild('chart', { static: true }) chart!: ChartComponent;
  @Input() secondaryTitleCols: ColumnConfig = { field: '', header: '' };
  @Input() secondaryTitleData: Record<string, number | string>[] = [];
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() table: any;
  @Input() tableCols: ColumnConfig[] = [];
  @Input() type = 'bar';

  // @Input() set type(value: string) {
  //   this.apexStore.setType(value);
  // }

  @Input() set showPercent(value: boolean) {
    this.apexStore.showPercent(value);
  }
  @Input() set colours(value: string[]) {
    this.apexStore.setColours(value);
  }

  @Input() set series(value: ApexAxisChartSeries) {
    this.apexStore.setSeries(value);
  }

  @Input() set xAxis(value: string[]) {
    this.apexStore.setXAxis(value);
  }

  @Input() set yAxis(value: string) {
    this.apexStore.setYAxis(value);
  }

  @Input() set horizontal(value: boolean) {
    this.apexStore.setHorizontal(value);
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
