import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConducteursComponent } from './conducteurs.component';

describe('ConducteursComponent', () => {
  let component: ConducteursComponent;
  let fixture: ComponentFixture<ConducteursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConducteursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConducteursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
