import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DidYouKnowComponent } from './did-you-know.component';

describe('DidYouKnowComponent', () => {
  let component: DidYouKnowComponent;
  let fixture: ComponentFixture<DidYouKnowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DidYouKnowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DidYouKnowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
