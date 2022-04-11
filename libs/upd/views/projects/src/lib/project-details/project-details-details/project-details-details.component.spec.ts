import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsDetailsComponent } from './project-details-details.component';

describe('ProjectDetailsSummaryComponent', () => {
  let component: ProjectDetailsDetailsComponent;
  let fixture: ComponentFixture<ProjectDetailsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDetailsDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
