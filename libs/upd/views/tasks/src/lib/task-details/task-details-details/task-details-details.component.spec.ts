import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsDetailsComponent } from './task-details-details.component';

describe('TaskDetailsDetailsComponent', () => {
  let component: TaskDetailsDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaskDetailsDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskDetailsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});