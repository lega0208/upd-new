import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsFeedbackComponent } from './project-details-feedback.component';

describe('ProjectDetailsFeedbackComponent', () => {
  let component: ProjectDetailsFeedbackComponent;
  let fixture: ComponentFixture<ProjectDetailsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectDetailsFeedbackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
