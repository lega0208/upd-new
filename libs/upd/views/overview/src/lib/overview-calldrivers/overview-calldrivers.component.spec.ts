import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';
import { routerReducer } from '@ngrx/router-store';
import {
  dateSelectionReducer,
  I18nFacade,
  i18nReducer,
} from '@dua-upd/upd/state';
import { I18nModule } from '@dua-upd/upd/i18n';
import { OverviewCalldriversComponent } from './overview-calldrivers.component';
import { OverviewFacade } from '../+state/overview/overview.facade';
import {
  OVERVIEW_FEATURE_KEY,
  overviewReducer,
} from '../+state/overview/overview.reducer';
import { OverviewRoutingModule } from '../overview-routing.module';
import { DataCardComponent, UpdComponentsModule } from '@dua-upd/upd-components';

import '@angular/localize/init';

describe('OverviewCalldriversComponent', () => {
  let component: OverviewCalldriversComponent;
  let fixture: ComponentFixture<OverviewCalldriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        I18nModule.forRoot(),
        StoreModule.forRoot({
          dateSelection: dateSelectionReducer,
          router: routerReducer,
          i18n: i18nReducer,
        }),
        StoreModule.forFeature(OVERVIEW_FEATURE_KEY, overviewReducer),
        OverviewRoutingModule,
        UpdComponentsModule,
      ],
      declarations: [OverviewCalldriversComponent],
      providers: [I18nFacade, OverviewFacade],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewCalldriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create OverviewCalldriversComponent', () => {
    expect(component).toBeTruthy();
  });

  it(`should have a currentCallVolume`, () => {
    expect(component.currentCallVolume$).toBeTruthy();
  });

  it(`should have a callPercentChange`, () => {
    expect(component.callPercentChange$).toBeTruthy();
  });

  it(`DataCard should render title as 'Call Volume`, () => {
    // eslint-disable-next-line prefer-const
    let fixtureDataCardComponent = TestBed.createComponent(DataCardComponent);
    // eslint-disable-next-line prefer-const
    let dataCardInstance = fixtureDataCardComponent.componentInstance;
    expect(dataCardInstance.title).toBe('');
    fixture.detectChanges();
    dataCardInstance.title = 'Call Volume';
    expect(dataCardInstance.title).toBe('Call Volume');
  });

  it(`DataCard should render title as 'Call Volume`, () => {
    // eslint-disable-next-line prefer-const
    let fixtureDataCardComponent = TestBed.createComponent(DataCardComponent);
    // eslint-disable-next-line prefer-const
    let dataCardInstance = fixtureDataCardComponent.componentInstance;
    expect(dataCardInstance.tooltip).toBe('');
    fixture.detectChanges();
    dataCardInstance.tooltip = 'tooltip-call-volume';
    expect(dataCardInstance.tooltip).toBe('tooltip-call-volume');
  });

  it('DataCard should have Call Volume data the CallDriversComponent', () => {
    const fixtureDataCardComponent = TestBed.createComponent(DataCardComponent);
    const dataCardInstance = fixtureDataCardComponent.componentInstance;
    const current = dataCardInstance.current$;
    expect(current).toBeTruthy();
  });

  it('DataCard should have Call Volume comparison data the CallDriversComponent', () => {
    const fixtureDataCardComponent = TestBed.createComponent(DataCardComponent);
    const dataCardInstance = fixtureDataCardComponent.componentInstance;
    const comparison = dataCardInstance.comparison$;
    expect(comparison).toBeTruthy();
  });
});
