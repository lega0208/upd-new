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

  @Input() set showPercent(value: { isPercent: boolean, showTitleTooltip: boolean, showMarker: boolean, shared: boolean} ) {
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

  @Input() set horizontal( value: { isHorizontal: boolean, colorDistributed: boolean} ) {
    this.apexStore.setHorizontal( value );
  }

  readonly vm$ = this.apexStore.vm$;
  readonly hasData$ = this.apexStore.hasData$;

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
