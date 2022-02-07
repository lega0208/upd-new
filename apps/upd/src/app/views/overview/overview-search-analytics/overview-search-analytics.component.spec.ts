import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewSearchAnalyticsComponent } from './overview-search-analytics.component';

describe('OverviewSearchAnalyticsComponent', () => {
  let component: OverviewSearchAnalyticsComponent;
  let fixture: ComponentFixture<OverviewSearchAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverviewSearchAnalyticsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewSearchAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
