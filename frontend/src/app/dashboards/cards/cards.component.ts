/*
updateEnrichedPos(event: EnrichedPosition[]) {
    this.installedDevice = event;
  }
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MapHomeService } from '../../services/map-home.service';
import { Device, VehiculeService } from '../../services/vehicule.service';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SuperviseurService } from '../../services/superviseur.service';
import { ConducteursService } from '../../services/conducteurs.service';
import {EnrichedPosition} from '../../models/models.model';
import {AuthentificationsService} from '../../services/authentifications.service';
import {Superviseur, Driver} from '../../models/models.model';

@Component({
  selector: 'app-cards',
  standalone: false,
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit, OnDestroy {
  map: any;

  deviceCount = 0;
  supervisorCount = 0;
  driverCount = 0;
  reinitialiserMap = false;
  modalVisible = false;
  geofenceDrawerVisible = false;
  installedDevice: EnrichedPosition[] = [];
  geofenceVisible= false;
  selectedDevice: EnrichedPosition | null = null;
  mapEnrichedSelectedDevice!: EnrichedPosition;
  private positionSub: Subscription | undefined;
  markerLngLat: any;
  Visible= false;


  constructor(
    private mapHomeService: MapHomeService,
    private vehiculeService: VehiculeService,
    private superviseurService:SuperviseurService,
    private conducteursService:ConducteursService,
    public authentificationsService: AuthentificationsService
  ) {}


    ngOnInit() {
    console.log('CardsComponent chargé !');
    this.fetchData();
    this.mapHomeService.fullData$.subscribe(data => {
      if (data) {
        this.installedDevice = data;
      }
    })

  }
  onMarkerClicked(position: EnrichedPosition) {
    console.log('Marqueur cliqué !', position);

    this.mapEnrichedSelectedDevice = position;
    this.selectedDevice = position;
    this.modalVisible = true;
    this.geofenceVisible = true;

  }


  handleOpenGeofence() {
    this.modalVisible = false;
    this.geofenceDrawerVisible = true;
  }

  handleCancel(): void {
    this.modalVisible = false;
  }

  onClickInstaller() {
    this.selectedDevice = null;
    this.reinitialiserMap = true;
  }

  onDeviceSelected(device: EnrichedPosition) {
    this.Visible=true;

    this.selectedDevice = { ...device }; //stocke toute les attributs du device dans selectedDevice
  }


  fetchData() {
    this.vehiculeService.getDevices()
      .pipe(catchError(error => {
        console.error('Erreur API devices:', error);
        return of([]);
      }))
      .subscribe((devices: Device[]) => {
        this.deviceCount = devices.length;
      });

    this.superviseurService.getSuperviseur()
      .pipe(catchError(error => {
        console.error('Erreur API users:', error);
        return of([]);
      }))
      .subscribe((superviseur: Superviseur[]) => {
        this.supervisorCount = superviseur.length;

      });

    this.conducteursService.getDriver()
      .pipe(catchError(error => {
        console.error('Erreur API drivers:', error);
        return of([]);
      }))
      .subscribe((drivers: Driver[]) => {
        this.driverCount = drivers.length;
      });
  }

  ngOnDestroy() {
    this.positionSub?.unsubscribe();
  }
 MarkerVisible= false;
  confVisible= false;
  markZone() {
    this.confVisible = true;

  this.MarkerVisible = !this.MarkerVisible;
  console.log("mark",this.MarkerVisible);
  }

  geofenceFormDirectVisible = false;

  confirmZone() {
    this.geofenceDrawerVisible= true;
    this.geofenceFormDirectVisible = true;
    this.MarkerVisible = false;

  }

  updateMarkerLoc(event: any) {
    console.log("mrkl", event);
    this.markerLngLat = event;
  }


}
