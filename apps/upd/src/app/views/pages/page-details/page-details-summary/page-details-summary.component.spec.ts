import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageDetailsSummaryComponent } from './page-details-summary.component';

describe('PageDetailsSummaryComponent', () => {
  let component: PageDetailsSummaryComponent;
  let fixture: ComponentFixture<PageDetailsSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageDetailsSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageDetailsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
