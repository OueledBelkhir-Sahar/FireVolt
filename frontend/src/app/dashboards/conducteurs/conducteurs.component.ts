import { Component, OnInit  } from '@angular/core';
import { ConducteursService } from '../../services/conducteurs.service';
import {AuthentificationsService} from '../../services/authentifications.service';
import {Driver} from '../../models/models.model';
import {createDefaultConducteur} from '../../utils/create-default-conducteur';

@Component({
  selector: 'app-conducteurs',
  templateUrl: './conducteurs.component.html',
  standalone: false,
  styleUrls: ['./conducteurs.component.scss']
})
export class ConducteursComponent implements OnInit{

  selectedDriver =  createDefaultConducteur();
  driver: Driver[] = [];
  showForm: boolean = false;
  searchValue = '';
  visible = false;
  listOfDisplayData = [...this.driver];

  constructor(private conducteursService: ConducteursService,
              public authentificationsService: AuthentificationsService
  ) {}


  ngOnInit(): void {
    this.loadDriver();

  }

  updateDriver(driver: Driver){
    this.selectedDriver= {...driver};
    console.log("Conducteur sélectionné:", this.selectedDriver);
    this.showForm = true;
    console.log("Formulaire affiché:", this.showForm);

  }

  deleteConducteur(data:Driver){
    this.conducteursService.deleteDriver(data).subscribe(
      {
        next: () => {
          this.loadDriver()
        }
      }
    )
  }

  loadDriver(){
    this.conducteursService.getDriver().subscribe(
      {
        next: (value) => {
          this.driver = value;
          this.listOfDisplayData = [...this.driver];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des conducteurs:', err);
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
    this.listOfDisplayData = this.driver.filter((item: Driver) => item.name.indexOf(this.searchValue) !== -1);
  }

  toggleForm(): void {
    this.selectedDriver = createDefaultConducteur()
    this.showForm = !this.showForm;
  }

}
