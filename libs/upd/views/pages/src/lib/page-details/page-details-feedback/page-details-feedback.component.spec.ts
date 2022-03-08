import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageDetailsFeedbackComponent } from './page-details-feedback.component';

describe('PageDetailsFeedbackComponent', () => {
  let component: PageDetailsFeedbackComponent;
  let fixture: ComponentFixture<PageDetailsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageDetailsFeedbackComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageDetailsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
