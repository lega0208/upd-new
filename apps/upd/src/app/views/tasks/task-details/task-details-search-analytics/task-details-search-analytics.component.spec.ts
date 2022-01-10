import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsSearchAnalyticsComponent } from './task-details-search-analytics.component';

describe('TaskDetailsSearchAnalyticsComponent', () => {
  let component: TaskDetailsSearchAnalyticsComponent;
  let fixture: ComponentFixture<TaskDetailsSearchAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaskDetailsSearchAnalyticsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsSearchAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
