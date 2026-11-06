import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { AddsupervieurService } from '../../services/addsupervieur.service';
import { createDefaultSuperviseur } from '../../utils/create-default-superviseur';

@Component({
  standalone: false,
  selector: 'app-add-superviseur',
  templateUrl: './add-superviseur.component.html',
  styleUrls: ['./add-superviseur.component.scss']
})
export class AddSuperviseurComponent implements OnInit, OnDestroy {
  @Input() superviseur= createDefaultSuperviseur();
  @Input() isVisibleS = true;
  @Output() addEvent = new EventEmitter<void>();
  @Output() cancelEvent = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  superviseurForm: FormGroup;

  constructor(private addsupervieurService: AddsupervieurService, private fb: NonNullableFormBuilder) {
    this.superviseurForm = this.fb.group({
      region: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }



  ngOnInit(): void{

    this.superviseurForm.patchValue({
      region: this.superviseur?.attributes.region || '',
      name: this.superviseur?.name || '',
      email: this.superviseur?.email || '',
      phone: this.superviseur?.phone || '',
      password: this.superviseur?.password || '',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  handleOk(): void {
    console.log('Button ok clicked!');
    this.addSuperviseur();

  }

  handleCancel(): void {

    this.cancelEvent.emit();
    console.log('Button cancel clicked!');
  }


  addSuperviseur(): void {
    console.log('ID du conducteur:', this.superviseur.id);

          const formData = this.superviseurForm.value;
          const SuperviseurData = {
            id: this.superviseur.id,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            supervisor: true as true,
            attributes: {
              region:formData.region,
            }
          };

    console.log('Superviseur data to send:', SuperviseurData);

    this.addsupervieurService.addSuperviseur(SuperviseurData).subscribe({
      next: () => {
        this.addEvent.emit();
        },
      error: (error) => {
        console.error(error);
      }
    });
  }

}
