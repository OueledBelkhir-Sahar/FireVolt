import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddconducteurComponent } from './addconducteur.component';

describe('AddconducteurComponent', () => {
  let component: AddconducteurComponent;
  let fixture: ComponentFixture<AddconducteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddconducteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddconducteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
