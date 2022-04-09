import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsCalldriversComponent } from './project-details-calldrivers.component';

describe('ProjectDetailsCalldriversComponent', () => {
  let component: ProjectDetailsCalldriversComponent;
  let fixture: ComponentFixture<ProjectDetailsCalldriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDetailsCalldriversComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsCalldriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
