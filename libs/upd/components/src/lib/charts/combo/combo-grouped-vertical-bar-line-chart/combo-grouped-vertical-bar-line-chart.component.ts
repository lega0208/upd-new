import {
  Component,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter,
  ViewChild,
  HostListener,
  ContentChild,
  TemplateRef,
  TrackByFunction,
  ChangeDetectionStrategy,
} from '@angular/core';

import { curveLinear } from 'd3-shape';
import { scaleBand, scaleLinear, scalePoint, scaleTime } from 'd3-scale';
import {
  BaseChartComponent,
  LineSeriesComponent,
  ViewDimensions,
  ColorHelper,
  calculateViewDimensions,
  ScaleType,
  Orientation,
  Color,
  LegendPosition,
  LegendOptions,
  BarOrientation,
  DataItem,
} from '@amonsour/ngx-charts';
import { isPlatformServer } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'combo-grouped-vertical-bar-line-chart',
  templateUrl: './combo-grouped-vertical-bar-line-chart.component.html',
  styleUrls: ['./combo-grouped-vertical-bar-line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('animationState', [
      transition(':leave', [
        style({
          opacity: 1,
          transform: '*',
        }),
        animate(500, style({ opacity: 0, transform: 'scale(0)' })),
      ]),
    ]),
  ],
})
export class ComboGroupedVerticalBarLineChartComponent extends BaseChartComponent {
  @Input() curve: any = curveLinear;
  @Input() legend = false;
  @Input() legendTitle = 'Legend';
  @Input() legendPosition: LegendPosition = LegendPosition.Right;
  @Input() xAxis: any;
  @Input() yAxis: any;
  @Input() lineChart: any;
  @Input() showXAxisLabel!: boolean;
  @Input() showYAxisLabel!: boolean;
  @Input() xAxisLabel!: string;
  @Input() yAxisLabel!: string;
  @Input() tooltipDisabled = false;
  @Input() scaleType: ScaleType = ScaleType.Ordinal;
  @Input() gradient!: boolean;
  @Input() showGridLines = true;
  @Input() activeEntries: any[] = [];
  @Input() override schemeType!: ScaleType;
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() rotateXAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() xAxisTickFormatting: any;
  @Input() yAxisTickFormatting: any;
  @Input() xAxisTicks!: any[];
  @Input() yAxisTicks!: any[];
  @Input() yLeftAxisScaleFactor: any;
  @Input() yRightAxisScaleFactor: any;
  @Input() yRightAxisTickFormatting: any;
  @Input() showRightYAxisLabel: any;
  @Input() yAxisLabelRight: any;
  @Input() colorSchemeLine!: Color;
  @Input() groupPadding = 8;
  @Input() barPadding = 8;
  @Input() roundDomains = false;
  @Input() roundEdges = true;
  @Input() yScaleMax!: number;
  @Input() showDataLabel = false;
  @Input() dataLabelFormatting: any;
  @Input() noBarWhenZero = true;
  @Input() hasRange!: boolean;
  @Input() autoScale!: boolean;
  @Input() yScaleMin!: number;
  @Input() xScaleMin!: number;
  @Input() xScaleMax!: number;
  @Input() rangeFillOpacity!: number;
  @Input() colorLabelRight!: string;
  @Input() colorLabelDefault!: string;
  @Input() colorLabelLeft!: string;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('tooltipTemplate') tooltipTemplate!: TemplateRef<any>;
  @ContentChild('seriesTooltipTemplate')
  seriesTooltipTemplate!: TemplateRef<any>;

  @ViewChild(LineSeriesComponent) lineSeriesComponent!: LineSeriesComponent;

  dims!: ViewDimensions;
  xSet: any;
  xScale: any;
  yScale: any;
  combinedSeries: any;
  groupDomain!: string[];
  innerDomain!: string[];
  valueDomain!: [number, number];
  groupScale: any;
  innerScale: any;
  valueScale: any;
  yScaleLine: any;
  xScaleLine: any;
  transform!: string;
  colors!: ColorHelper;
  colorsLine!: ColorHelper;
  margin: number[] = [10, 20, 10, 20];
  xAxisHeight = 0;
  yAxisWidth = 0;
  legendOptions!: LegendOptions;
  dataLabelMaxHeight: any = { negative: 0, positive: 0 };
  yOrientLeft = Orientation.Left;
  yOrientRight = Orientation.Right;
  filteredDomain: any;
  xDomainLine: any;
  yDomainLine: any;
  seriesDomain: any;
  hoveredVertical!: false;
  isSSR = false;
  seriesColors!: ColorHelper;
  barOrientation = BarOrientation;
  bandwidth!: number;
  legendSpacing = 0;

  override ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      this.isSSR = true;
    }
  }

  override update(): void {
    super.update();

    if (!this.showDataLabel) {
      this.dataLabelMaxHeight = { negative: 0, positive: 0 };
    }
    this.margin = [
      10 + this.dataLabelMaxHeight.positive,
      20,
      10 + this.dataLabelMaxHeight.negative,
      20,
    ];

    this.dims = calculateViewDimensions({
      width: this.width,
      height: this.height,
      margins: this.margin,
      showXAxis: this.xAxis,
      showYAxis: this.yAxis,
      xAxisHeight: this.xAxisHeight,
      yAxisWidth: this.yAxisWidth,
      showXLabel: this.showXAxisLabel,
      showYLabel: this.showYAxisLabel,
      showLegend: this.legend,
      legendType: this.schemeType,
      legendPosition: this.legendPosition,
    });

    if (this.showDataLabel) {
      this.dims.height -= this.dataLabelMaxHeight.negative;
    }

    if (!this.yAxis) {
      this.legendSpacing = 0;
    } else if (
      this.showRightYAxisLabel &&
      this.yAxis &&
      this.legendPosition == LegendPosition.Right
    ) {
      this.legendSpacing = 80;
    } else if (
      this.showRightYAxisLabel &&
      this.yAxis &&
      this.legendPosition == LegendPosition.Below
    ) {
      this.legendSpacing = 80;
    } else {
      this.legendSpacing = 40;
    }

    this.formatDates();

    this.groupDomain = this.getGroupDomain();
    this.innerDomain = this.getInnerDomain();
    this.valueDomain = this.getValueDomain();

    this.groupScale = this.getGroupScale();
    this.innerScale = this.getInnerScale();
    this.valueScale = this.getValueScale();

    // line chart
    this.xDomainLine = this.getXDomainLine();
    if (this.filteredDomain) {
      this.xDomainLine = this.filteredDomain;
    }

    this.yDomainLine = this.getYDomainLine();
    this.seriesDomain = this.getSeriesDomain();

    this.scaleLines();

    //

    this.setColors();
    this.legendOptions = this.getLegendOptions();
    this.transform = `translate(${this.dims.xOffset} , ${
      this.margin[0] + this.dataLabelMaxHeight.negative
    })`;
  }

  deactivateAll() {
    this.activeEntries = [...this.activeEntries];
    for (const entry of this.activeEntries) {
      this.deactivate.emit({ value: entry, entries: [] });
    }
    this.activeEntries = [];
  }

  @HostListener('mouseleave')
  hideCircles(): void {
    this.hoveredVertical = false;
    this.deactivateAll();
  }

  updateHoveredVertical(item: any): void {
    this.hoveredVertical = item.value;
    this.deactivateAll();
  }

  updateDomain(domain: any): void {
    this.filteredDomain = domain;
    this.xDomainLine = this.filteredDomain;
    this.xScaleLine = this.getXScaleLine(
      this.xDomainLine,
      this.groupScale.bandwidth()
    );
  }

  scaleLines() {
    this.xScaleLine = this.getXScaleLine(this.xDomainLine, this.dims.width);
    this.yScaleLine = this.getYScaleLine(this.yDomainLine, this.dims.height);
  }

  getSeriesDomain(): string[] {
    let domain;
    this.combinedSeries = [];

    for (domain of this.innerDomain)
      this.combinedSeries.push({
        name: domain,
        series: this.getValueDomainSelection(domain),
      });

    for (domain of this.lineChart)
      this.combinedSeries.push({ name: domain.name, series: domain.series });

    return this.combinedSeries.map((d: { name: any }) => d.name);
  }

  isDate(value: any): boolean {
    if (value instanceof Date) {
      return true;
    }

    return false;
  }

  getScaleType(values: any): ScaleType {
    let date = true;
    let num = true;

    for (const value of values) {
      if (!this.isDate(value)) {
        date = false;
      }

      if (typeof value !== 'number') {
        num = false;
      }
    }

    if (date) {
      return ScaleType.Time;
    }

    if (num) {
      return ScaleType.Linear;
    }

    return ScaleType.Ordinal;
  }

  getXDomainLine(): any[] {
    let values: any[] = [];

    for (const results of this.lineChart) {
      for (const d of results.series) {
        if (!values.includes(d.name)) {
          values.push(d.name);
        }
      }
    }

    this.scaleType = this.getScaleType(values);
    let domain = [];

    if (this.scaleType === ScaleType.Linear) {
      values = values.map((v) => Number(v));
    }

    let min: any;
    let max: any;
    if (
      this.scaleType === ScaleType.Time ||
      this.scaleType === ScaleType.Linear
    ) {
      min = this.xScaleMin ? this.xScaleMin : Math.min(...values);
      max = this.xScaleMax ? this.xScaleMax : Math.max(...values);
    }

    if (this.scaleType === ScaleType.Time) {
      domain = [new Date(min), new Date(max)];
      this.xSet = [...values].sort((a, b) => {
        const aDate = a.getTime();
        const bDate = b.getTime();
        if (aDate > bDate) return 1;
        if (bDate > aDate) return -1;
        return 0;
      });
    } else if (this.scaleType === ScaleType.Linear) {
      domain = [min, max];
      // Use compare function to sort numbers numerically
      this.xSet = [...values].sort((a, b) => a - b);
    } else {
      domain = values;
      this.xSet = values;
    }

    return domain;
  }

  getYDomainLine(): [number, number] {
    const domain = [];
    for (const results of this.lineChart) {
      for (const d of results.series) {
        if (domain.indexOf(d.value) < 0) {
          domain.push(d.value);
        }
        if (d.min !== undefined) {
          this.hasRange = true;
          if (domain.indexOf(d.min) < 0) {
            domain.push(d.min);
          }
        }
        if (d.max !== undefined) {
          this.hasRange = true;
          if (domain.indexOf(d.max) < 0) {
            domain.push(d.max);
          }
        }
      }
    }

    const values = [...domain];
    if (!this.autoScale) {
      values.push(0);
    }

    const min = this.yScaleMin ? this.yScaleMin : Math.min(...values);

    let max = Math.max(...values);

    const num_digits1 = Math.floor(Math.log10(max)) + 1;
    max =
      Math.ceil(max / Math.pow(10, num_digits1 - 1)) *
      Math.pow(10, num_digits1 - 1);

    //const max = this.yScaleMax ? this.yScaleMax : Math.max(...values);

    return [min, max];
  }

  getValueDomainSelection(label: string): string[] {
    const domain: any = [];
    for (const group of this.results) {
      for (const d of group.series) {
        if (d.label === label) {
          domain.push({ name: group.label, value: d.value });
        }
      }
    }

    return domain;
  }

  getXScaleLine(domain: any, width: number): any {
    let scale;

    if (this.scaleType === ScaleType.Time) {
      scale = scaleTime().range([0, width]).domain(domain);
    } else if (this.scaleType === ScaleType.Linear) {
      scale = scaleLinear().range([0, width]).domain(domain);

      if (this.roundDomains) {
        scale = scale.nice();
      }
    } else if (this.scaleType === ScaleType.Ordinal) {
      scale = scalePoint()
        .rangeRound([0, width])
        .padding(0.5)
        .domain(this.groupDomain);
    }

    return scale;
  }

  getYScaleLine(domain: any, height: number): any {
    const scale = scaleLinear().range([height, 0]).domain(domain);

    return this.roundDomains ? scale.nice() : scale;
  }

  getGroupScale(): any {
    const spacing =
      this.groupDomain.length / (this.dims.height / this.groupPadding + 1);

    return scaleBand()
      .rangeRound([0, this.dims.width])
      .paddingInner(spacing)
      .paddingOuter(spacing / 2)
      .domain(this.groupDomain);
  }

  getInnerScale(): any {
    const width = this.groupScale.bandwidth();
    const spacing = this.innerDomain.length / (width / this.barPadding + 1);
    return scaleBand()
      .rangeRound([0, width])
      .paddingInner(spacing)
      .domain(this.innerDomain);
  }

  getValueScale(): any {
    const scale = scaleLinear()
      .range([this.dims.height, 0])
      .domain(this.valueDomain);
    return this.roundDomains ? scale.nice() : scale;
  }

  getGroupDomain(): string[] {
    const domain: any[] = [];
    for (const group of this.results) {
      if (!domain.includes(group.label)) {
        domain.push(group.label);
      }
    }

    return domain;
  }

  getInnerDomain(): string[] {
    const domain: any[] = [];
    for (const group of this.results) {
      for (const d of group.series) {
        if (!domain.includes(d.label)) {
          domain.push(d.label);
        }
      }
    }

    return domain;
  }

  getValueDomain(): [number, number] {
    const domain: any[] = [];
    for (const group of this.results) {
      for (const d of group.series) {
        if (!domain.includes(d.value)) {
          domain.push(d.value);
        }
      }
    }

    let max = Math.max(...domain);

    const num_digits1 = Math.floor(Math.log10(max)) + 1;
    max =
      Math.ceil(max / Math.pow(10, num_digits1 - 1)) *
      Math.pow(10, num_digits1 - 1);

    const min = Math.min(0, ...domain);
    //const max = this.yScaleMax ? Math.max(this.yScaleMax, ...domain) : Math.max(0, ...domain);

    return [min, max];
  }

  onClick(data: any, group?: DataItem): void {
    if (group) {
      data.series = group.name;
    }

    this.select.emit(data);
  }

  groupTransform(group: DataItem): string {
    return `translate(${this.groupScale(group.label)}, 0)`;
  }

  trackBy: TrackByFunction<any> = (index: number, item: DataItem) => {
    return item.name;
  };

  // trackBy(_index: any, item: any): string {
  //   return `${item.name}`;
  // }

  setColors(): void {
    let domain;
    if (this.schemeType === ScaleType.Ordinal) {
      domain = this.innerDomain;
    } else {
      domain = this.valueDomain;
    }

    this.colors = new ColorHelper(
      this.scheme,
      this.schemeType,
      domain,
      this.customColors
    );
    this.colorsLine = new ColorHelper(
      this.colorSchemeLine,
      this.schemeType,
      domain,
      this.customColors
    );

    //this.seriesColors = (this.colors, this.colorsLine);
  }

  getLegendOptions(): LegendOptions {
    const opts = {
      scaleType: this.schemeType as any,
      colors: undefined as any,
      domain: [] as any[],
      title: undefined as any,
      position: this.legendPosition,
    };
    if (opts.scaleType === ScaleType.Ordinal) {
      opts.domain = this.seriesDomain;
      opts.colors = this.colorsLine;
      opts.title = this.legendTitle;
    } else {
      opts.domain = this.valueDomain;
      opts.colors = this.colors.scale;
    }

    return opts;
  }

  updateLineWidth(width: any): void {
    this.bandwidth = width;
    this.scaleLines();
  }

  updateYAxisWidth({ width }: { width: number }): void {
    this.yAxisWidth = width + 20;
    this.update();
  }

  updateXAxisHeight({ height }: { height: number }): void {
    this.xAxisHeight = height;
    this.update();
  }

  // onActivate(event, group: DataItem, fromLegend: boolean = false): void {
  //   const item = Object.assign({}, event);
  //   if (group) {
  //     item.series = group.name;
  //   }

  //   const items = this.results
  //     .map(g => g.series)
  //     .flat()
  //     .filter(i => {
  //       if (fromLegend) {
  //         return i.label === item.name;
  //       } else {
  //         return i.name === item.name && i.series === item.series;
  //       }
  //     });

  //   this.activeEntries = [...items];
  //   this.activate.emit({ value: item, entries: this.activeEntries });
  // }

  onActivate(
    event: any,
    group: DataItem | undefined,
    fromLegend: boolean = false
  ) {
    const item = Object.assign({}, event);
    if (group) {
      item.series = group.name;
    }

    const items = this.results
      .map((g: { series: any }) => g.series)
      .flat()
      .filter((i: { label: any; name: any; series: any }) => {
        if (fromLegend) {
          return i.label === item.name;
        } else {
          return i.name === item.name && i.series === item.series;
        }
      });

    const idx = this.activeEntries.findIndex((d) => {
      return (
        d.name === event.name &&
        d.value === event.value &&
        d.series === event.series
      );
    });
    if (idx > -1) {
      return;
    }

    this.activeEntries = [item, ...items];
    this.activate.emit({ value: item, entries: this.activeEntries });
  }

  onDeactivate(
    event: any,
    group: DataItem | undefined,
    fromLegend: boolean = false
  ): void {
    const item = Object.assign({}, event);
    if (group) {
      item.series = group.name;
    }

    this.activeEntries = this.activeEntries.filter((i) => {
      if (fromLegend) {
        return i.label !== item.name;
      } else {
        return (
          i.name === item.name &&
          i.value === item.value &&
          i.series === item.series
        );
      }
    });

    const idx = this.activeEntries.findIndex((d) => {
      return (
        d.name === item.name &&
        d.value === item.value &&
        d.series === item.series
      );
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({ value: item, entries: this.activeEntries });
  }

  onDataLabelMaxHeightChanged(
    event: { size: { negative: any; height: number } },
    groupIndex: number
  ): void {
    if (event.size.negative) {
      this.dataLabelMaxHeight.negative = Math.max(
        this.dataLabelMaxHeight.negative,
        event.size.height
      );
    } else {
      this.dataLabelMaxHeight.positive = Math.max(
        this.dataLabelMaxHeight.positive,
        event.size.height
      );
    }
    if (groupIndex === this.results.length - 1) {
      setTimeout(() => this.update());
    }
  }
}
