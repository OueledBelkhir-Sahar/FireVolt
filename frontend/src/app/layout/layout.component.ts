import {Component, OnDestroy, OnInit} from '@angular/core';
import {LayoutService, Session} from '../services/layout.service';
import {Router} from '@angular/router';
import dayjs from 'dayjs';
import {MapHomeService} from '../services/map-home.service';
import {Subscription} from 'rxjs';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import { Howl } from 'howler';
import {AuthentificationsService} from '../services/authentifications.service';
import {Device, VehiculeService} from '../services/vehicule.service';


@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  userName: string = '';
  showLogout: boolean = false;
  isUserIconClicked: boolean = false;
  selectedPeriod: string = 'today';
  private positionsSubscription: Subscription | undefined;
  startDate: Date | null = null;
  endDate: Date | null = null;
  notifications: any[]= [];
  private sound: Howl;


  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private mapHomeService: MapHomeService,
    private notification: NzNotificationService,
    public authentificationsService: AuthentificationsService,
    private vehiculeService: VehiculeService,
  ) {
    this.sound = new Howl({
      src: ['assets/mixkit-correct-answer-tone-2870.wav'],
      volume: 1.0
    });
  }


  ngOnInit() {
    this.layoutService.getSession().subscribe(
      (session: Session | any) => {
        this.userName = session.name;
      },
      (error) => {

        console.log(error);
        this.router.navigate(['/login']);
      }
    );

    this.mapHomeService.connectWebSocket();
    this.positionsSubscription = this.mapHomeService.socketEvents.subscribe(
      (notifications: any[]) => {
        console.log("data", notifications);
        if (notifications && notifications.length) {
          notifications.forEach(notification => {
            this.notifications.push({
              title : notification.attributes.message
            });
            this.notification.create(
              'warning',
              notification.eventTime,
              notification.attributes.message
            );
            this.sound.play();
          })
        }

      });
  }
  // Méthode à appeler quand l'utilisateur change la periode
  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    //ne rien envoyer au layoutservise si period = custom
    if (period !== 'custom') {
      this.startDate = null;
      this.endDate = null;
      this.layoutService.setPeriod(period);
    }
  }

  // Méthode à appeler quand l'utilisateur change la date

  onCustomDateSelected(): void {
    if (this.startDate && this.endDate) {
      const start = dayjs(this.startDate).startOf('day').toISOString(); // 00:00:00
      const end = dayjs(this.endDate).endOf('day').toISOString();       // 23:59:59

      this.layoutService.setCustomPeriod({ from: start, to: end });
    }
  }


  logout() {
    this.router.navigate(['/login']);
  }

  handleUserIconClick() {
    this.isUserIconClicked = !this.isUserIconClicked;
    this.showLogout = this.isUserIconClicked;
  }

  isMapRoute(): boolean {
    return this.router.url.includes('/map')  || this.router.url.includes('/notifications');

  }

  ngOnDestroy(): void {
    this.mapHomeService.disconnectWebSocket();
  }

  goToDriverHistory() {
    this.vehiculeService.getDevices().subscribe((devices: Device[]) => {

      if (devices.length === 1) {
        const deviceId = devices[0].id; // Le seul device du conducteur
        this.router.navigate(['/map', deviceId]);
      } else {
        console.error('Aucun device trouvé .');
      }
    });
  }


}
