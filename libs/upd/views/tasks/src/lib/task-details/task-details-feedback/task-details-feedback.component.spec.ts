import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsFeedbackComponent } from './task-details-feedback.component';

describe('TaskDetailsFeedbackComponent', () => {
  let component: TaskDetailsFeedbackComponent;
  let fixture: ComponentFixture<TaskDetailsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsFeedbackComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
