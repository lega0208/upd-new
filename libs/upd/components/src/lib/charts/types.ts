import * as shape from 'd3-shape';

export const curves = {
  Basis: shape.curveBasis,
  Bundle: shape.curveBundle.beta(1),
  Cardinal: shape.curveCardinal,
  'Catmull Rom': shape.curveCatmullRom,
  Linear: shape.curveLinear,
  'Monotone X': shape.curveMonotoneX,
  'Monotone Y': shape.curveMonotoneY,
  Natural: shape.curveNatural,
  Step: shape.curveStep,
  'Step After': shape.curveStepAfter,
  'Step Before': shape.curveStepBefore,
  default: shape.curveLinear,
};

export type Curves = keyof typeof curves;
