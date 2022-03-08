import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsWebtrafficComponent } from './task-details-webtraffic.component';

describe('TaskDetailsWebtrafficComponent', () => {
  let component: TaskDetailsWebtrafficComponent;
  let fixture: ComponentFixture<TaskDetailsWebtrafficComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDetailsWebtrafficComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsWebtrafficComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
