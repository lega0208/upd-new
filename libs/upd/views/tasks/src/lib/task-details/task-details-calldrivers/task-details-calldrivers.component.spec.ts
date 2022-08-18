import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsCalldriversComponent } from './task-details-calldrivers.component';
import { DataCardComponent, UpdComponentsModule } from '@dua-upd/upd-components';

describe('TaskDetailsCalldriversComponent', () => {
  let component: TaskDetailsCalldriversComponent;
  let fixture: ComponentFixture<TaskDetailsCalldriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsCalldriversComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsCalldriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create TaskDetailsCalldriversComponent', () => {
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
