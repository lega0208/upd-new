import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesDetailsSearchAnalyticsComponent } from './pages-details-search-analytics.component';

describe('PageDetailsSearchAnalyticsComponent', () => {
  let component: PagesDetailsSearchAnalyticsComponent;
  let fixture: ComponentFixture<PagesDetailsSearchAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesDetailsSearchAnalyticsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesDetailsSearchAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
