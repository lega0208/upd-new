import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStatusLabelComponent } from './project-status-label.component';

describe('ProjectStatusLabelComponent', () => {
  let component: ProjectStatusLabelComponent;
  let fixture: ComponentFixture<ProjectStatusLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectStatusLabelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectStatusLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should take an object that maps css classes to values', () => {

  })
});
