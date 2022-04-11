import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsUxTestsComponent } from './task-details-ux-tests.component';

describe('TaskDetailsUxTestsComponent', () => {
  let component: TaskDetailsUxTestsComponent;
  let fixture: ComponentFixture<TaskDetailsUxTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsUxTestsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsUxTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
