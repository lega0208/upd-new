import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { I18nFacade } from '@dua-upd/upd/state';
import { LocaleNumberPipe, LocalePercentPipe } from '@dua-upd/upd/pipes';

export type ComparisonStatus = 'good' | 'bad' | 'neutral' | 'none';

export interface ComparisonStyles {
  colourClass: string;
  iconName: string;
}

export interface ComparisonConfig {
  styles: Record<string, ComparisonStyles>;
  getStyleConfig: (comparisonValue: number) => ComparisonStyles;
  mode: 'upGoodDownBad' | 'upBadDownGood';
}

export const comparisonStyling: Record<ComparisonStatus, ComparisonStyles> = {
  good: {
    colourClass: 'text-success',
    iconName: 'arrow_upward',
  },
  bad: {
    colourClass: 'text-danger',
    iconName: 'arrow_downward',
  },
  neutral: {
    colourClass: '',
    iconName: '',
  },
  none: {
    colourClass: 'hidden',
    iconName: '',
  },
};

export type KpiObjectiveStatus = 'pass' | 'fail' | 'partial' | 'none';

export type KpiObjectiveStatusConfig = Record<
  KpiObjectiveStatus,
  ComparisonStyles & { message: string }
>;

export type KpiObjectiveCriteria = (
  current: number,
  comparison: number
) => KpiObjectiveStatus;

export type KpiOptionalConfig = {
  [key in KpiObjectiveStatus]?: {
    [styles in keyof ComparisonStyles & { message: string }]: string;
  };
};

const defaultKpiObjectiveStatusConfig: KpiObjectiveStatusConfig = {
  pass: {
    colourClass: 'text-success',
    iconName: 'check_circle',
    message: 'kpi-met',
  },
  fail: {
    colourClass: 'text-danger',
    iconName: 'warning',
    message: 'kpi-not-met',
  },
  partial: {
    colourClass: 'text-semisuccess',
    iconName: 'check_circle',
    message: 'kpi-half-met',
  },
  none: {
    colourClass: 'hidden',
    iconName: '',
    message: '',
  },
};

const defaultKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case current < 0.8 && comparison < 0.2:
      return 'fail';
    case current < 0.8 && comparison >= 0.2:
      return 'partial';
    case current >= 0.8:
      return 'pass';
    default:
      return 'none';
  }
};

@Component({
  selector: 'upd-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataCardComponent {
  @Input() current: number | null = null;
  @Input() comparison?: number | null;
  @Input() title = '';
  @Input() tooltip = '';
  @Input() pipe: 'percent' | 'number' = 'number';
  @Input() pipeParams?: string;
  @Input() emptyMessage = 'nodata-available';

  @Input() comparisonMode: 'upGoodDownBad' | 'upBadDownGood' = 'upGoodDownBad';
  @Input() displayComparison = true;

  @Input() kpiObjectiveCriteria = defaultKpiObjectiveCriteria;
  @Input() kpiStylesConfig: KpiOptionalConfig = {};
  @Input() displayKpis = false;

  get kpiConfig(): KpiObjectiveStatusConfig {
    const mergedConfig = { ...defaultKpiObjectiveStatusConfig };

    // merge any provided config options with defaults
    for (const key of Object.keys(
      this.kpiStylesConfig
    ) as KpiObjectiveStatus[]) {
      mergedConfig[key] = {
        ...mergedConfig[key],
        ...this.kpiStylesConfig[key],
      };
    }

    return mergedConfig;
  }

  get kpiObjectiveStatus() {
    return typeof this.current === 'number'
      ? this.kpiObjectiveCriteria(this.current, this.comparison || 0)
      : 'none';
  }

  get comparisonStyles() {
    if (!this.displayComparison || typeof this.comparison !== 'number') {
      return comparisonStyling.none;
    }

    if (this.comparisonMode === 'upBadDownGood') {
      // JSON stringify/parse to deep clone object
      const styling = JSON.parse(JSON.stringify(comparisonStyling));
      styling.good.iconName = 'arrow_downward';
      styling.bad.iconName = 'arrow_upward';

      switch (true) {
        case this.comparison < 0:
          return styling.good;
        case this.comparison > 0:
          return styling.bad;
        default:
          return styling.neutral;
      }
    }

    switch (true) {
      case this.comparison > 0:
        return comparisonStyling.good;
      case this.comparison < 0:
        return comparisonStyling.bad;
      default:
        return comparisonStyling.neutral;
    }
  }

  constructor(
    private i18n: I18nFacade,
    private numberPipe: LocaleNumberPipe,
    private percentPipe: LocalePercentPipe
  ) {}

  get localePipe() {
    switch (this.pipe) {
      case 'number':
        return this.numberPipe;
      case 'percent':
        return this.percentPipe;
      default:
        return this.numberPipe;
    }
  }
}

export const callVolumeObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case current === 0:
      return 'none';
    case comparison > -0.05:
      return 'fail';
    case comparison <= -0.05:
      return 'pass';
    default:
      return 'none';
  }
};
