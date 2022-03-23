import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesDetailsFeedbackComponent } from './pages-details-feedback.component';

describe('PageDetailsFeedbackComponent', () => {
  let component: PagesDetailsFeedbackComponent;
  let fixture: ComponentFixture<PagesDetailsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesDetailsFeedbackComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesDetailsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
