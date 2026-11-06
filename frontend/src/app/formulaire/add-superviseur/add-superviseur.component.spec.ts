import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSuperviseurComponent } from './add-superviseur.component';

describe('AddSuperviseurComponent', () => {
  let component: AddSuperviseurComponent;
  let fixture: ComponentFixture<AddSuperviseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddSuperviseurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSuperviseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
