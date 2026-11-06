import {Component, OnInit} from '@angular/core';
import {Device, VehiculeService} from '../../services/vehicule.service';
import {AuthentificationsService} from '../../services/authentifications.service';

@Component({
  selector: 'app-local',
  standalone: false,
  templateUrl: './local.component.html',
  styleUrl: './local.component.scss'
})
export class LocalComponent implements OnInit{

  selectedDevice: Device = {
    name: '',
    uniqueId: '',
    attributes:{
      region: '' ,
      speedLimit:'',
    },
  }
  device: Device[] = [];
  showForm: boolean = false;
  searchValue = '';
  visible = false;
  listOfDisplayData = [...this.device];

   constructor(
    private vehiculeService: VehiculeService,
    public authentificationsService : AuthentificationsService,
  ) {}


  ngOnInit(): void {
    this.loadVehicule();

  }

  editVehicle(device: Device) {
    this.selectedDevice = {...device};
    console.log("Véhicule sélectionné:", this.selectedDevice);
    this.showForm = true;
    console.log("Formulaire affiché:", this.showForm);

  }

  loadVehicule() {
    this.vehiculeService.getDevices().subscribe(
      {
        next: (value) => {
          this.device = value;
          this.listOfDisplayData = [...this.device];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des véhicules:', err);
        }
      }
    )
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.device.filter((item: Device) => item.uniqueId.indexOf(this.searchValue) !== -1);
  }

  // Fonction pour afficher ou cacher le formulaire

  toggleForm(): void {
    this.selectedDevice = {
      name: '',
      uniqueId: '',
      attributes:{
        region: '' ,
        speedLimit:'',
      },

    };
    this.showForm = !this.showForm;
  }


  deleteVehicle(data: Device) {
    this.vehiculeService.deleteVehicule(data).subscribe(
      {
        next: () => {
          this.loadVehicule()
        }
      }
    )
  }


  associerForm: boolean = false;
  deviceToAssociate!: Device;

  associerConducteur(device: Device): void {
    this.deviceToAssociate = { ...device };
    this.associerForm = true;
  }


}
