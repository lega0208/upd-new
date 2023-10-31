import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
} from '@angular/router';

export class AppRouteReuseStrategy extends BaseRouteReuseStrategy {
  public override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ) {
    const langChange =
      future?.routeConfig?.path === ':lang' &&
      curr?.routeConfig?.path === ':lang';

    const childrenAreTheSame =
      future?.routeConfig?.children === curr?.routeConfig?.children;

    const routeConfigsAreTheSame = future.routeConfig === curr.routeConfig;

    return (langChange && childrenAreTheSame) || routeConfigsAreTheSame;
  }
}
