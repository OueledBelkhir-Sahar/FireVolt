import {Component, OnDestroy, OnInit, Input, Output, EventEmitter, model, inject} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {Notification} from '../../services/notification.service';
import { Validators, FormBuilder} from '@angular/forms';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-add-notification',
  standalone: false,
  templateUrl: './add-notification.component.html',
  styleUrl: './add-notification.component.scss'
})
export class AddNotificationComponent implements OnInit, OnDestroy{
  @Input() notif: Notification ={
    description : '',
    type: '',
  };
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() addEvent = new EventEmitter<any>();
  @Input() isVisibleF = true;


  message: string= '';
  private destroy$ = new Subject<void>();


  constructor (private notificationService: NotificationService,  ){}
  private fb = inject(FormBuilder);

  validateForm = this.fb.group({
    description: this.fb.control<string | null>(null),
    type: this.fb.control<string | null>(null, Validators.required)
  });

  ngOnInit(): void {
    if (this.notif) {
      this.validateForm.patchValue({
        description: this.notif.description,
        type: this.notif.type || '',
      });
    }
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.addNotif();

  }
  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.cancelEvent.emit();
  }
  submitForm(): void {
    if (this.validateForm.valid) {
      console.log('Ajouter', this.validateForm.value);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
  addNotif(): void {
    if (this.validateForm.invalid) {
      this.submitForm();
      return;
    }
    const formData = this.validateForm.value;
    const notifData = {
      description: this.validateForm.value.description ?? '',
      type: this.validateForm.value.type ?? '',
      always: true,
      notificators: 'web',
      calendarId: 0,
      attributes: {},
    };

    console.log('notifData', notifData);
    this.notificationService.addNotif(notifData).subscribe({
      next:()=>{
        this.addEvent.emit();
        this.message= 'Notification ajouté avec succès !';
        this.isVisibleF = false;
      },
      error: (error) => {
        this.message = 'Erreur lors de l\'ajout du notification.';
        console.error(error);
      }
    })
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
