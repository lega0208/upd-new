import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsCalldriversComponent } from './task-details-calldrivers.component';

describe('TaskDetailsWebtrafficComponent', () => {
  let component: TaskDetailsCalldriversComponent;
  let fixture: ComponentFixture<TaskDetailsCalldriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsCalldriversComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsCalldriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
