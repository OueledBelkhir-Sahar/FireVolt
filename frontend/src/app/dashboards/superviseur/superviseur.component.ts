import { Component, OnInit } from '@angular/core';
import { SuperviseurService } from '../../services/superviseur.service';
import { Superviseur} from '../../models/models.model';
import { createDefaultSuperviseur } from '../../utils/create-default-superviseur';

@Component({
  selector: 'app-superviseur',
  standalone: false,
  templateUrl: './superviseur.component.html',
  styleUrl: './superviseur.component.scss'
})
export class SuperviseurComponent implements OnInit {

  selectedSup = createDefaultSuperviseur();
  superviseurs: Superviseur[] = [];
  showForm: boolean = false;
  searchValue = '';
  visible = false;
  listOfData = [...this.superviseurs];

  constructor(
    private superviseurService: SuperviseurService,
  ) {}


  ngOnInit(): void {
    this.loadSuperviseur();
  }



  editSup(superviseurs: Superviseur) {
    this.selectedSup = {...superviseurs};
    console.log("Conducteur sélectionné:", this.selectedSup);
    this.showForm = true;
    console.log("Formulaire affiché:", this.showForm);

  }

  loadSuperviseur(){
    this.superviseurService.getSuperviseur().subscribe(
      {
        next: (value) => {
          this.superviseurs = value;
          this.listOfData = [...this.superviseurs];
        },
        error: (err) => {
          console.error('Erreur lors du chargement des superviseurs:', err);
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
    this.superviseurs = this.superviseurs.filter((item: Superviseur) => item.name.indexOf(this.searchValue) !== -1);
  }

toggleForm(): void {
  this.selectedSup =createDefaultSuperviseur();
  this.showForm = !this.showForm;
}


deleteSuperviseur(data:Superviseur){
    this.superviseurService.deleteSup(data).subscribe(
      {
        next: () => {
          this.loadSuperviseur()
        }
      }
    )
  }
}
