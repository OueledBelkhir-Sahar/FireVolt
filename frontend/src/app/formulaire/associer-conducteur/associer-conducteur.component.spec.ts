import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssocierConducteurComponent } from './associer-conducteur.component';

describe('AssocierConducteurComponent', () => {
  let component: AssocierConducteurComponent;
  let fixture: ComponentFixture<AssocierConducteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssocierConducteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssocierConducteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
