import { AddconducteurService} from '../../services/addconducteur.service';
import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {FormGroup,FormControl,NonNullableFormBuilder,Validators} from '@angular/forms';
import { Subject } from 'rxjs';
import {createDefaultConducteur} from '../../utils/create-default-conducteur';

@Component({
  selector: 'app-addconducteur',
  standalone: false,
  templateUrl: './addconducteur.component.html',
  styleUrls: ['./addconducteur.component.scss']
})
export class AddconducteurComponent implements OnInit, OnDestroy {
  @Input() driver= createDefaultConducteur();
  @Input() isVisibleC = true;
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() addEvent = new EventEmitter<any>();

  message: string= '';
  private destroy$ = new Subject<void>();
  conducteurForm: FormGroup;

  constructor( private addconducteurService: AddconducteurService, private fb: NonNullableFormBuilder) {
    this.conducteurForm = this.fb.group({
      region: new FormControl('', Validators.required),
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      carNumber: new FormControl('',)
    })
  }

  ngOnInit(): void {
    this.conducteurForm.patchValue({
      region: this.driver?.attributes.region,
      name: this.driver?.name || '',
      email: this.driver?.email || '',
      phone: this.driver?.phone || '',
      password: this.driver?.password || '',
      carNumber: this.driver?.attributes.carNumber || '',
    });
  }



  handleOk(): void {
    console.log('Button ok clicked!');
    this.addCon();

  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.cancelEvent.emit();
  }




  addCon(): void {
    console.log('ID du conducteur:', this.driver.id);
    const formData = this.conducteurForm.value;
    const driverData = {
      id: this.driver.id,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      driver: true as true,
      attributes: {
        carNumber:formData.carNumber,
        region:formData.region,
      }
    };
    console.log('Driver data to send:', driverData);
    this.addconducteurService.addConducteur(driverData).subscribe({

      next: () => {
        this.addEvent.emit();
        this.message = 'Conducteur ajouté avec succès!';
        },

      error: (error) => {
        this.message = 'Erreur lors de l\'ajout du conducteur.';
        console.error(error);
      }
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
