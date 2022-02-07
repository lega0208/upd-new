import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsSummaryComponent } from './task-details-summary.component';

describe('TaskDetailsSummaryComponent', () => {
  let component: TaskDetailsSummaryComponent;
  let fixture: ComponentFixture<TaskDetailsSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsSummaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
