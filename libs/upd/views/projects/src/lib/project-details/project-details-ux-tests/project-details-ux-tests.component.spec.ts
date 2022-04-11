import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsUxTestsComponent } from './project-details-ux-tests.component';

describe('ProjectDetailsSummaryComponent', () => {
  let component: ProjectDetailsUxTestsComponent;
  let fixture: ComponentFixture<ProjectDetailsUxTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDetailsUxTestsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsUxTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
