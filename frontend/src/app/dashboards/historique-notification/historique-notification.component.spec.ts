import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueNotificationComponent } from './historique-notification.component';

describe('HistoriqueNotificationComponent', () => {
  let component: HistoriqueNotificationComponent;
  let fixture: ComponentFixture<HistoriqueNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoriqueNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
