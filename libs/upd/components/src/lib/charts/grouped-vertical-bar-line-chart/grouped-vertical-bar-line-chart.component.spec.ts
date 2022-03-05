import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupedVerticalBarLineChartComponent } from './grouped-vertical-bar-line-chart.component';

describe('GroupedVerticalBarLineChartComponent', () => {
  let component: GroupedVerticalBarLineChartComponent;
  let fixture: ComponentFixture<GroupedVerticalBarLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupedVerticalBarLineChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedVerticalBarLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
