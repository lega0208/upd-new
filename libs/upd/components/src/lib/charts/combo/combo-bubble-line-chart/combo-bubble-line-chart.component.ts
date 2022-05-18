import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import {
  BaseChartComponent,
  BubbleChartSeries,
  calculateViewDimensions,
  ColorHelper,
  getDomain,
  getScale,
  getScaleType,
  id,
  LegendOptions,
  LegendPosition,
  LineSeriesComponent,
  ScaleType,
  ViewDimensions,
} from '@amonsour/ngx-charts';
import { scaleLinear, scalePoint, scaleTime } from 'd3-scale';
import { curveLinear } from 'd3-shape';
import { isPlatformServer } from '@angular/common';

@Component({
  selector: 'upd-combo-bubble-line-chart',
  templateUrl: './combo-bubble-line-chart.component.html',
  styleUrls: ['./combo-bubble-line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('animationState', [
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(
          500,
          style({
            opacity: 0,
          })
        ),
      ]),
    ]),
  ],
})
export class ComboBubbleLineChartComponent
  extends BaseChartComponent
  implements OnInit
{
  @Input() showGridLines = true;
  @Input() legend = false;
  @Input() legendTitle = 'Legend';
  @Input() legendPosition: LegendPosition = LegendPosition.Right;
  @Input() xAxis = true;
  @Input() yAxis = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() xAxisLabel = '';
  @Input() yAxisLabel = '';
  @Input() trimXAxisTicks = true;
  @Input() trimYAxisTicks = true;
  @Input() rotateXAxisTicks = true;
  @Input() maxXAxisTickLength = 16;
  @Input() maxYAxisTickLength = 16;
  @Input() xAxisTickFormatting: any;
  @Input() yAxisTickFormatting: any;
  @Input() xAxisTicks!: any[];
  @Input() yAxisTicks!: any[];
  @Input() roundDomains = false;
  @Input() maxRadius = 10;
  @Input() minRadius = 3;
  @Input() autoScale!: boolean;
  @Input() override schemeType: ScaleType = ScaleType.Ordinal;
  @Input() tooltipDisabled = false;
  @Input() xScaleMin!: number;
  @Input() xScaleMax!: number;
  @Input() yScaleMin!: number;
  @Input() yScaleMax!: number;
  @Input() lineChart: any;

  //line
  @Input() curve = curveLinear;
  @Input() rangeFillOpacity = 0.15;
  yScaleLine: any;
  xScaleLine: any;
  hoveredVertical!: false;

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('tooltipTemplate') tooltipTemplate!: TemplateRef<any>;
  @ContentChild('seriesTooltipTemplate')
  seriesTooltipTemplate!: TemplateRef<any>;

  @ViewChild(LineSeriesComponent) lineSeriesComponent!: LineSeriesComponent;

  dims!: ViewDimensions;
  colors!: ColorHelper;

  @Input() scaleType: ScaleType = ScaleType.Ordinal;
  margin: number[] = [10, 20, 10, 20];
  bubblePadding: number[] = [0, 0, 0, 0];
  data!: BubbleChartSeries[];

  legendOptions!: LegendOptions;
  transform!: string;

  clipPath!: string;
  clipPathId!: string;

  seriesDomain!: any;
  xDomain!: number[];
  yDomain!: number[];
  rDomain!: number[];

  xScaleType!: ScaleType;
  yScaleType!: ScaleType;

  yScale: any;
  xScale: any;
  rScale: any;

  xAxisHeight = 0;
  yAxisWidth = 0;

  activeEntries: any[] = [];

  isSSR = false;
  xDomainLine: any;
  filteredDomain: any;
  combinedSeries: any;
  groupScale: any;
  innerScale: any;
  groupDomain!: string[];
  innerDomain!: string[];
  yDomainLine: any;
  hasRange!: boolean;
  xSet: any;
  valueDomain!: [number, number];

  override ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      this.isSSR = true;
    }
  }

  override update(): void {
    super.update();

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

    this.seriesDomain = this.results.map((d: any) => d.name);
    this.rDomain = this.getRDomain();
    this.xDomain = this.getXDomain();
    this.yDomain = this.getYDomain();

    this.data = this.results;

    this.minRadius = Math.max(this.minRadius, 1);
    this.maxRadius = Math.max(this.maxRadius, 1);

    this.rScale = this.getRScale(this.rDomain, [
      this.minRadius,
      this.maxRadius,
    ]);

    this.bubblePadding = [0, 0, 0, 0];
    this.setScales();

    this.bubblePadding = this.getBubblePadding();
    this.setScales();

    this.groupDomain = this.getGroupDomain();
    this.innerDomain = this.getInnerDomain();
    this.valueDomain = this.getValueDomain();

    // line chart
    this.xDomainLine = this.getXDomainLine();
    if (this.filteredDomain) {
      this.xDomainLine = this.filteredDomain;
    }

    this.xDomainLine = this.getYDomainLine();
    this.seriesDomain = this.getSeriesDomain();

    const colorDomain =
      this.schemeType === ScaleType.Ordinal ? this.seriesDomain : this.rDomain;
    this.colors = new ColorHelper(
      this.scheme,
      this.schemeType,
      colorDomain,
      this.customColors
    );

    this.legendOptions = this.getLegendOptions();

    this.clipPathId = 'clip' + id().toString();
    this.clipPath = `url(#${this.clipPathId})`;

    this.transform = `translate(${this.dims.xOffset},${this.margin[0]})`;
    //
  }

  @HostListener('mouseleave')
  hideCircles(): void {
    this.deactivateAll();
  }

  onClick(data: any, series?: any): void {
    if (series) {
      data.series = series.name;
    }

    this.select.emit(data);
  }

  getBubblePadding(): number[] {
    let yMin = 0;
    let xMin = 0;
    let yMax = this.dims.height;
    let xMax = this.dims.width;

    for (const s of this.data) {
      for (const d of s.series) {
        const r = this.rScale(d.r);
        const cx =
          this.xScaleType === ScaleType.Linear
            ? this.xScale(Number(d.x))
            : this.xScale(d.x);
        const cy =
          this.yScaleType === ScaleType.Linear
            ? this.yScale(Number(d.y))
            : this.yScale(d.y);
        xMin = Math.max(r - cx, xMin);
        yMin = Math.max(r - cy, yMin);
        yMax = Math.max(cy + r, yMax);
        xMax = Math.max(cx + r, xMax);
      }
    }

    xMax = Math.max(xMax - this.dims.width, 0);
    yMax = Math.max(yMax - this.dims.height, 0);

    return [yMin, xMax, yMax, xMin];
  }

  setScales() {
    let width = this.dims.width;
    if (this.xScaleMin === undefined && this.xScaleMax === undefined) {
      width = width - this.bubblePadding[1];
    }
    let height = this.dims.height;
    if (this.yScaleMin === undefined && this.yScaleMax === undefined) {
      height = height - this.bubblePadding[2];
    }
    this.xScale = this.getXScale(this.xDomain, width);
    this.yScale = this.getYScale(this.yDomain, height);
  }

  getYScale(domain: any, height: number): any {
    return getScale(
      domain,
      [height, this.bubblePadding[0]],
      this.yScaleType,
      this.roundDomains
    );
  }

  getXScale(domain: any, width: number): any {
    return getScale(
      domain,
      [this.bubblePadding[3], width],
      this.xScaleType,
      this.roundDomains
    );
  }

  getRScale(domain: any, range: any): any {
    const scale = scaleLinear().range(range).domain(domain);

    return this.roundDomains ? scale.nice() : scale;
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
      opts.colors = this.colors;
      opts.title = this.legendTitle;
    } else {
      opts.domain = this.rDomain;
      opts.colors = this.colors.scale;
    }

    return opts;
  }

  getXDomain(): number[] {
    const values: any[] = [];

    for (const results of this.results) {
      for (const d of results.series) {
        if (!values.includes(d.x)) {
          values.push(d.x);
        }
      }
    }

    this.xScaleType = getScaleType(values);
    return getDomain(
      values,
      this.xScaleType,
      this.autoScale,
      this.xScaleMin,
      this.xScaleMax
    );
  }

  getYDomain(): number[] {
    const values: number[] = [];

    for (const results of this.results) {
      for (const d of results.series) {
        if (!values.includes(d.y)) {
          values.push(d.y);
        }
      }
    }

    this.yScaleType = getScaleType(values);
    return getDomain(
      values,
      this.yScaleType,
      this.autoScale,
      this.yScaleMin,
      this.yScaleMax
    );
  }

  getRDomain(): [number, number] {
    let min = Infinity;
    let max = -Infinity;

    for (const results of this.results) {
      for (const d of results.series) {
        const value = Number(d.r) || 1;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }

    return [min, max];
  }

  updateYAxisWidth({ width }: { width: number }): void {
    this.yAxisWidth = width;
    this.update();
  }

  updateXAxisHeight({ height }: { height: number }): void {
    this.xAxisHeight = height;
    this.update();
  }

  // line

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
    for (const group of this.lineChart) {
      for (const d of group.series) {
        if (!domain.includes(d.label)) {
          domain.push(d.label);
        }
      }
    }

    console.log(domain);

    return domain;
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

  //

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

    //this.seriesColors = (this.colors, this.colorsLine);
  }

  isDate(value: any): boolean {
    if (value instanceof Date) {
      return true;
    }

    return false;
  }

  onActivate(item: any): void {
    const idx = this.activeEntries.findIndex((d) => {
      return d.name === item.name;
    });
    if (idx > -1) {
      return;
    }

    this.activeEntries = [item, ...this.activeEntries];
    this.activate.emit({ value: item, entries: this.activeEntries });
  }

  onDeactivate(item: any): void {
    const idx = this.activeEntries.findIndex((d) => {
      return d.name === item.name;
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({ value: item, entries: this.activeEntries });
  }

  deactivateAll(): void {
    this.activeEntries = [...this.activeEntries];
    for (const entry of this.activeEntries) {
      this.deactivate.emit({ value: entry, entries: [] });
    }
    this.activeEntries = [];
  }

  updateHoveredVertical(item: any): void {
    this.hoveredVertical = item.value;
    this.deactivateAll();
  }

  trackBy(index: number, item: any): string {
    return `${item.name}`;
  }
}
