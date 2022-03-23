import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageDetailsSearchAnalyticsComponent } from './page-details-search-analytics.component';

describe('PageDetailsSearchAnalyticsComponent', () => {
  let component: PageDetailsSearchAnalyticsComponent;
  let fixture: ComponentFixture<PageDetailsSearchAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageDetailsSearchAnalyticsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageDetailsSearchAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
