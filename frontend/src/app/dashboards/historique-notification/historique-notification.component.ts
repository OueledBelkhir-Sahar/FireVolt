import { Component, OnInit } from '@angular/core';
import {Notifications ,NotificationService} from '../../services/notification.service';
import { LayoutService } from '../../services/layout.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription} from 'rxjs';

@Component({
  selector: 'app-historique-notification',
  standalone: false,
  templateUrl: './historique-notification.component.html',
  styleUrl: './historique-notification.component.scss'
})
export class HistoriqueNotificationComponent implements OnInit{

  notifications: Notifications [] = [];
  listOfDisplayData = [...this.notifications];
  deviceId: number | null = null;
  periodSub!: Subscription;
  selectedPeriod: string = 'today';
  searchValue = '';
  visible = false;


  constructor(
    private notificationService: NotificationService,
    private layoutService : LayoutService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const deviceIdParam = this.route.snapshot.paramMap.get('deviceId');
    if (deviceIdParam) {
      this.deviceId = parseInt(deviceIdParam, 10);
      console.log(" ID trouvé :", this.deviceId);
    } else {
      console.log(" Aucun ID trouvé dans l'URL.");
      this.deviceId = null;
    }

    // écoute du changement de période (today, yesterday, etc.)
    this.periodSub = this.layoutService.period$.subscribe(period => {
      this.selectedPeriod = period;
      this.loadNotification();
    });
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
  loadNotification(){
    const { from, to } = this.layoutService.getPeriodDates(this.selectedPeriod);

   if (this.deviceId !== null){
     this.notificationService.getHistoriqueNotif(this.deviceId, from, to).subscribe(
       {
         next: (value) => {
           this.notifications = value;
           this.listOfDisplayData = [...this.notifications];
         },
         error: (err) => {
           console.error('Erreur lors du chargement des Notifications:', err);
         }
       }
     )
   }
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.notifications.filter((item: Notifications) => item.type.indexOf(this.searchValue) !== -1);
  }

  goToPositions(): void {
    if (this.deviceId !== null) {
      this.router.navigate(['/map', this.deviceId]);
    }
  }
}
