import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleChartComponent } from './example-chart.component';

describe('ExampleChartComponent', () => {
  let component: ExampleChartComponent;
  let fixture: ComponentFixture<ExampleChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExampleChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExampleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
