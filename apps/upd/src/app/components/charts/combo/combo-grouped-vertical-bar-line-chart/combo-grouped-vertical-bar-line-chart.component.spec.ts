import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComboGroupedVerticalBarLineChartComponent } from './combo-grouped-vertical-bar-line-chart.component';

describe('ComboGroupedVerticalBarLineChartComponent', () => {
  let component: ComboGroupedVerticalBarLineChartComponent;
  let fixture: ComponentFixture<ComboGroupedVerticalBarLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComboGroupedVerticalBarLineChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ComboGroupedVerticalBarLineChartComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
