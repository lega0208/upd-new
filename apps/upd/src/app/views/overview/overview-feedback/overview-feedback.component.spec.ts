import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewFeedbackComponent } from './overview-feedback.component';

describe('OverviewFeedbackComponent', () => {
  let component: OverviewFeedbackComponent;
  let fixture: ComponentFixture<OverviewFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverviewFeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
