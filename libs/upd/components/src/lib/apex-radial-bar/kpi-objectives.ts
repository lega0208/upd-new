import {
  KpiObjectiveCriteria,
  KpiObjectiveStatusConfig,
} from '../data-card/data-card.component';

export const defaultKpiObjectiveStatusConfig: KpiObjectiveStatusConfig = {
  pass: {
    colour: '#26A69A',
    colourClass: 'text-success',
    iconName: 'arrow_upward',
    message: 'kpi-met',
  },
  fail: {
    colour: '#DF2929',
    colourClass: 'text-danger',
    iconName: 'arrow_downward',
    message: 'kpi-not-met',
  },
  partial: {
    colour: '#F57F17',
    colourClass: 'text-semisuccess',
    iconName: 'arrow_upward',
    message: 'kpi-half-met',
  },
  none: {
    colour: 'hidden',
    colourClass: 'hidden',
    iconName: '',
    message: '',
  },
};

export const defaultKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case comparison > 0:
      return 'fail';
    case comparison <= 0 && comparison > -0.02:
      return 'partial';
    case comparison <= -0.02:
      return 'pass';
    default:
      return 'none';
  }
};

export const searchKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case comparison >= 0.1:
      return 'pass';
    case comparison > 0.03:
      return 'partial';
    case comparison <= 0.03:
      return 'fail';
    default:
      return 'none';
  }
};

export const uxTestsKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case current >= 0.8:
      return 'pass';
    case current >= 0.6:
      return 'partial';
    case current < 0.6:
      return 'fail';
    default:
      return 'none';
  }
};

export const feedbackKpiObjectiveCriteria: KpiObjectiveCriteria = (
  current,
  comparison: number
) => {
  switch (true) {
    case comparison >= 0.2:
      return 'pass';
    case comparison >= 0.0 && comparison < 0.2:
      return 'partial';
    case comparison < 0.0:
      return 'fail';
    default:
      return 'none';
  }
};
