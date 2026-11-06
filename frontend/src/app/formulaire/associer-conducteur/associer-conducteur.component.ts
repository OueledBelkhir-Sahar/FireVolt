import {Component, Input, Output, EventEmitter, OnInit, inject} from '@angular/core';
import {ConducteursService} from '../../services/conducteurs.service';
import {AssocierService} from '../../services/associer.service';
import {Driver, Superviseur} from '../../models/models.model';
import {SuperviseurService} from '../../services/superviseur.service';

@Component({
  selector: 'app-associer-conducteur',
  standalone: false,
  templateUrl: './associer-conducteur.component.html',
  styleUrl: './associer-conducteur.component.scss'
})
export class AssocierConducteurComponent implements OnInit{

  @Input() deviceId?: number;
  @Output() cancelEvent = new EventEmitter<void>();
  @Input() isVisibleLink = true;

  conducteurs: Driver[] = [];
  superviseurs: Superviseur[] = [];
  selectedUserId?: number;

  step: number = 1;
  constructor(private conducteursService: ConducteursService,
              private associerService: AssocierService,
              private superviseurService:SuperviseurService,

  ) {}

  get utilisateursAffiches(): Driver[] {
    return this.step === 1 ? this.conducteurs : this.superviseurs as unknown as Driver[];
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.cancelEvent.emit();
    this.step = 1;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.associer();

  }
  ngOnInit(): void {

    this.conducteursService.getDriver().subscribe({
      next: (data) => this.conducteurs = data,
      error: (err) => console.error('Erreur lors du chargement des superviseurs', err)
    });

    this.superviseurService.getSuperviseur().subscribe({
      next: data => this.superviseurs = data,
      error: err => console.error('Erreur chargement superviseurs', err)
    });
  }


  associer() {
    console.log('UserID sélectionné:', this.selectedUserId);
    console.log('DeviceID sélectionné:', this.deviceId);


    if (!this.selectedUserId || !this.deviceId) {
      console.error('ID utilisateur ou appareil manquant');
      return;
    }

    this.associerService.associerConducteur({
      userId: this.selectedUserId,
      deviceId: this.deviceId
    }).subscribe({
      next: () => {
        console.log('Association réussie');
        if (this.step === 1) {
          this.step = 2;
          this.selectedUserId = undefined; // Reset pour l'étape suivante

        } else {
          this.cancelEvent.emit();
          this.step = 1;
        }
      },
      error: err => {
        console.error('Erreur lors de l\'association :', err);
      }
    });
  }
}
