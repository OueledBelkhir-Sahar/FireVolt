import {Component, OnInit} from '@angular/core';
import {Notification ,NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit {

  selectedNotification: Notification ={
    description: '',
    type: '',

  }

  notif: Notification[]=[];
  listOfDisplayData = [...this.notif];
  searchType = '';
  showForm: boolean = false;
  visibleSearch = false;


  constructor(
    private notificationService : NotificationService
  ) {}
  ngOnInit(): void {
    this.loadNotif();
  }

  loadNotif() {
    this.notificationService.getNotif().subscribe(
      {
        next:(value)=> {
          this.notif = value;
          this.listOfDisplayData = [...this.notif];
        },
        error:(error)=> {
          console.error('Erreur lors du chargement des notifications:', error);
        }
      }
    )
  }
  reset(): void {
    this.searchType = '';
    this.search();
  }

  search(): void {
    this.visibleSearch = false;
    this.listOfDisplayData = this.notif.filter((item: Notification) => item.type.indexOf(this.searchType) !== -1);
  }

  // Fonction pour afficher ou cacher le formulaire

  toggleForm(): void {
    this.selectedNotification = {
      description: '',
      type: '',

    };
    this.showForm = !this.showForm;
  }
  typeLabelMap: { [key: string]: string } = {
    deviceOnline: 'Statut en ligne',
    deviceUnknown: 'Statut inconnu',
    deviceOffline: 'Statut hors ligne',
    deviceInactive: 'Appareil inactif',
    deviceMoving: 'Déplacement de l\'appareil',
    deviceStopped: 'Appareil arrêté',
    deviceOverspeed: 'Limite de vitesse dépassée',
    geofenceEnter: 'Entré du zone géofence',
    geofenceExit: 'Sortie de du zone géofence'
  };


  deleteNotification(data: Notification) {
    this.notificationService.deleteNotif(data).subscribe(
      {
        next:()=> {
          this.loadNotif()
        }
      }
    )
  }




}

