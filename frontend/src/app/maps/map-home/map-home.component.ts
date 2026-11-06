/*
import { Component, EventEmitter, Input, Output, OnChanges, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MapHomeService } from '../../services/map-home.service';
import * as turf from '@turf/turf';

type Type = 'Zone identifié' | 'Zone autorisé';

@Component({
  selector: 'app-geofence',
  standalone: false,
  templateUrl: './geofence.component.html',
  styleUrls: ['./geofence.component.scss']
})
export class GeofenceComponent implements OnChanges {
  @Input() visible = false;
  @Input() device: any;
  @Input() map: any;
  @Output() closeDrawer = new EventEmitter<void>();

  geofences: any[] = [];
  FormVisible = false;
  tempShapeId: string | null = null;

  private fb = inject(FormBuilder);

  validateForm = this.fb.group({
    nom: this.fb.control<string | null>(null, Validators.required),
    type: this.fb.control<Type | null>('Zone identifié', Validators.required),
    radius: this.fb.control<number | null>(500, [Validators.required, Validators.min(1)])
  });

  constructor(
    private httpClient: HttpClient,
    private mapHomeService: MapHomeService
  ) {}

  ngOnChanges(): void {
    if (this.visible && this.device) {
      this.loadGeofences(this.device.deviceId);
    }
  }

  close(): void {
    this.closeDrawer.emit();
  }

  toggleForm(): void {
    this.FormVisible = !this.FormVisible;
  }

  AjouterForm(): void {
    if (this.validateForm.valid && this.device) {
      this.FormVisible = false;
      this.enableMapClickToDraw();
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
    }
  }

  enableMapClickToDraw(): void {
    const radiusInMeters = this.validateForm.value.radius!;
    const name = this.validateForm.value.nom!;

    const mapClickHandler = (e: any) => {
      const center = [e.lngLat.lng, e.lngLat.lat];

      if (this.tempShapeId && this.map.getSource(this.tempShapeId)) {
        this.map.removeLayer(this.tempShapeId);
        this.map.removeSource(this.tempShapeId);
      }

      const circle = turf.circle(center, radiusInMeters, {
        steps: 64,
        units: 'meters'
      });

      const shapeId = `geofence-${Date.now()}`;
      this.tempShapeId = shapeId;

      this.map.addSource(shapeId, {
        type: 'geojson',
        data: circle
      });

      this.map.addLayer({
        id: shapeId,
        type: 'fill',
        source: shapeId,
        paint: {
          'fill-color': '#3b9ddd',
          'fill-opacity': 0.4
        }
      });

      const area = `CIRCLE(${center[0]} ${center[1]}, ${radiusInMeters})`;

      this.createGeofence(area, name);
      this.map.off('click', mapClickHandler);
    };

    this.map.on('click', mapClickHandler);
  }

  createGeofence(area: string, name: string): void {
    const body = {
      name: name,
      description: name,
      area: area
    };

    this.mapHomeService.createGeofence(body).subscribe((geofence: any) => {
      this.mapHomeService.linkDeviceToGeofence(geofence.id, this.device.deviceId).subscribe(() => {
        this.geofences.push(geofence);
        this.drawGeofenceOnMap(geofence);
      });
    });
  }

  drawGeofenceOnMap(geofence: any): void {
    const match = /CIRCLE\((-?\d+\.\d+) (-?\d+\.\d+), (\d+)\)/.exec(geofence.area);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      const radius = parseInt(match[3], 10);
      const shapeId = `geofence-${geofence.id}`;

      const circle = turf.circle([lng, lat], radius, {
        steps: 64,
        units: 'meters'
      });

      this.map.addSource(shapeId, {
        type: 'geojson',
        data: circle
      });

      this.map.addLayer({
        id: shapeId,
        type: 'fill',
        source: shapeId,
        paint: {
          'fill-color': '#3b9ddd',
          'fill-opacity': 0.3
        }
      });
    }
  }

  loadGeofences(deviceId: number): void {
    this.mapHomeService.getGeofencesByDeviceId(deviceId).subscribe((data) => {
      this.geofences = data;
      this.geofences.forEach(geofence => this.drawGeofenceOnMap(geofence));
    });
  }
}


 */
/*
//version du code total
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  OnChanges,
  EventEmitter,
  SimpleChanges
} from '@angular/core';
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import { Subscription } from 'rxjs';
import { MapHomeService } from '../../services/map-home.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map-home',
  standalone: false,
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss']
})

export class MapHomeComponent implements AfterViewInit,OnChanges, OnDestroy {

  selectedDevice: any = null;
  geofenceDrawerVisible = false;

  map: MapLibreMap | undefined; // Pour stocker l'objet carte
  private deviceMarkers: Map<number, Marker> = new Map<number, Marker>();
  private positionsSubscription: Subscription | undefined;
  private currentDeviceMarker: Marker | null = null; // Pour stocker le marqueur du device suivi

  @ViewChild('map', { static: true }) mapContainer!: ElementRef;

  @Input() selectedDeviceId: number | null = null;
  @Input() resetMapView: boolean = false;
  @Output() mapResetDone = new EventEmitter<void>();

  modalVisible = false;
  selectedPosition: any = null;

  constructor(
    private mapHomeService: MapHomeService,
  ) {}

  get isMapReady(): boolean {
    return this.mapLoaded && !!this.map;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetMapView'] && this.resetMapView === true) {
      this.resetToInitialView();
      this.mapResetDone.emit(); // Notifie le parent qu’on a fini
    }

    if (changes['selectedDeviceId'] && this.selectedDeviceId !== null) {
      this.centerMapOnDevice(this.selectedDeviceId);
    }
  }

  resetToInitialView(): void {
    const initialState = { lng: 10.1729, lat: 36.8702, zoom: 5 };
    this.map?.flyTo({
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      speed: 1.2
    });
  }


  centerMapOnDevice(deviceId: number) {
    const marker = this.deviceMarkers.get(deviceId);
    if (marker) {
      const lngLat = marker.getLngLat();
      this.map?.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 15,
        speed: 1.2
      });
    } else {
      console.warn(`Device ${deviceId} non trouvé sur la carte.`);
    }
  }
  mapLoaded = false;
  ngAfterViewInit() {
    const initialState = { lng: 10.1729, lat: 36.8702, zoom: 5 };

    this.map = new MapLibreMap({
      container: this.mapContainer.nativeElement,
      style: `https://tiles.stadiamaps.com/styles/osm_bright.json`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom
    });

    // Navigation control
    this.map.addControl(new NavigationControl({}), 'top-right');


    this.map.on('load', () => {
      if (this.map) {
        this.mapLoaded = true;
      }
      this.mapHomeService.connectWebSocket();

      this.positionsSubscription = this.mapHomeService.fullData$.subscribe(
        (positions: any[]) => {
          positions.forEach((position: any) => {
            const deviceId = position.deviceId;

            const oldMarker = this.deviceMarkers.get(deviceId);
            if (oldMarker) {
              oldMarker.remove();
            }

            const carIcon = document.createElement('img');
            carIcon.src = position.attributes.status
              ? 'https://cdn-icons-png.flaticon.com/512/4042/4042715.png'
              : 'https://cdn-icons-png.flaticon.com/512/2813/2813010.png';
            carIcon.style.width = '50px';
            carIcon.style.height = '50px';
            carIcon.style.cursor = 'pointer';



            carIcon.addEventListener('click', () => {
              this.showModal(position);
            });

            const marker = new Marker({ element: carIcon })
              .setLngLat([position.longitude, position.latitude])
              .addTo(this.map!);

            // Mise à jour du marqueur suivi
            if (this.selectedDeviceId === deviceId) {
              this.updateCurrentDeviceMarker(marker, position);
            }

            this.deviceMarkers.set(deviceId, marker);
          });
        }
      );
    });
  }

  updateCurrentDeviceMarker(marker: Marker, position: any) {
    // Si un marqueur de l'appareil est déjà présent, on le met à jour
    if (this.currentDeviceMarker) {
      this.currentDeviceMarker.setLngLat([position.longitude, position.latitude]);
    } else {
      this.currentDeviceMarker = marker;
    }

    // Centrer la carte sur le nouveau marqueur
    this.map?.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 15,
      speed: 1.2
    });
  }

  showModal(position?: any): void {
    this.selectedPosition = position ?? null;
    this.selectedDevice = {
      deviceId: position.deviceId,
      name: position.deviceName,
      uniqueId: position.uniqueId,
      model: position.model,
      nameDriver: position.nameDriver,
    };
    this.modalVisible = true;
  }
  handleOpenGeofence() {
    this.modalVisible = false;
    this.geofenceDrawerVisible = true;
  }


  handleCancel(): void {
    this.modalVisible = false;
  }




  ngOnDestroy() {
    this.map?.remove();
    this.deviceMarkers.forEach(marker => marker.remove());
    this.deviceMarkers.clear();
    if (this.positionsSubscription) {
      this.positionsSubscription.unsubscribe();
    }
    this.mapHomeService.disconnectWebSocket();
  }
}
*/
import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, OnChanges, EventEmitter, SimpleChanges } from '@angular/core';
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import { Subscription } from 'rxjs';
import { MapHomeService } from '../../services/map-home.service';
import {EnrichedPosition} from '../../models/models.model';

@Component({
  selector: 'app-map-home',
  standalone: false,
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss']
})

export class MapHomeComponent implements AfterViewInit, OnChanges, OnDestroy {

  map: MapLibreMap | undefined; // Pour stocker l'objet carte MapLibre
  deviceMarkers: Map<number, Marker> = new Map<number, Marker>();
  private positionsSubscription: Subscription | undefined;
  private currentDeviceMarker: Marker | null = null; // Pour stocker le marqueur du device suivi

  @ViewChild('map', { static: true }) mapContainer!: ElementRef<HTMLElement>;

  @Input() showMarker: boolean= false;
  @Input() selectedDeviceId: number | null = null;
  @Input() resetMapView: boolean = false;
  @Output() mapResetDone = new EventEmitter<void>();
  @Output() mapMarkerLocEvent = new EventEmitter<any>();
  @Output() IconClicked: EventEmitter<EnrichedPosition> = new EventEmitter<EnrichedPosition>();

  @Output() mapReady = new EventEmitter<any>();

  redMarker!: any;
  markerLngLat: any;
  constructor(
    private mapHomeService: MapHomeService,

  ) {}



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetMapView'] && this.resetMapView === true) {
      this.resetToInitialView();
      this.mapResetDone.emit(); // Notifie le parent qu’on a fini
    }

    if (changes['selectedDeviceId'] && this.selectedDeviceId !== null && this.selectedDeviceId !== undefined) {
      console.log('DeviceId reçu dans MapHomeComponent:', this.selectedDeviceId);  // Vérification

      this.centerMapOnDevice(this.selectedDeviceId);
    }

    if (changes['showMarker'] && this.showMarker && this.selectedDeviceId !== null) {
      console.log('Activation du marqueur draggable pour l’appareil:', this.selectedDeviceId);
      this.centerMapOnDevice(this.selectedDeviceId, true); // true = placer le marqueur rouge
    } else if (!this.showMarker) {
      if (this.redMarker) {
        this.redMarker.remove();
        this.redMarker = null;
      }
    }

  }

  resetToInitialView(): void {
    const initialState = { lng: 9.5375, lat: 33.8869, zoom: 5.4 };
    this.map?.flyTo({
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      speed: 1.2
    });
  }

  centerMapOnDevice(deviceId: number, placeDraggableMarker = false) {
    const marker = this.deviceMarkers.get(deviceId);
    if (marker) {
      const lngLat = marker.getLngLat();
      this.map?.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 15,
        speed: 1.2
      });

      if (placeDraggableMarker){
        // Supprimer l'ancien marqueur rouge s'il existe
        if (this.redMarker) this.redMarker.remove();
        this.redMarker = new Marker({ color: "#FF0000", draggable: true })
          .setLngLat([lngLat.lng, lngLat.lat])
          .addTo(this.map!);

        this.redMarker.on('dragend', () => {
          this.markerLngLat = this.redMarker.getLngLat();
          this.mapMarkerLocEvent.emit(this.markerLngLat);
          console.log('Nouvelle position du marqueur :', this.markerLngLat, this.markerLngLat);
        });
        this.markerLngLat = this.redMarker.getLngLat();
        this.mapMarkerLocEvent.emit(this.markerLngLat);
      }



    } else {
      console.warn(`Device ${deviceId} non trouvé sur la carte.`);
    }
  }

  mapLoaded = false;

  ngAfterViewInit() {
    const initialState = {lng: 9.5375, lat: 33.8869, zoom: 5.4 };
    if (this.mapContainer.nativeElement instanceof HTMLElement) {
    this.map = new MapLibreMap({
      container: this.mapContainer.nativeElement as HTMLDivElement,
      style: `https://tiles.stadiamaps.com/styles/osm_bright.json`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom
    });

    // Navigation control
    this.map.addControl(new NavigationControl({}), 'top-right');


      this.map.on('load', () => {
      if (this.map) {
        this.mapReady.emit(this.map);
        this.mapLoaded = true;
      }
      this.mapHomeService.connectWebSocket();

      this.positionsSubscription = this.mapHomeService.fullData$.subscribe(
        (enreichedPositions) => {
          console.log("enrPositions", enreichedPositions);
          if (enreichedPositions) {
            enreichedPositions.forEach((position) => {
              const deviceId = position.position.deviceId;
              console.log("positiongps", position);
              const oldMarker = this.deviceMarkers.get(deviceId); //nouvel position envoyé
              if (oldMarker) {
                oldMarker.remove();
              }

              const carIcon = document.createElement('img');
              carIcon.src = position.device.status==="online"
                ?  'https://cdn-icons-png.flaticon.com/512/2813/2813010.png'
                : 'https://cdn-icons-png.flaticon.com/512/4042/4042715.png';
              carIcon.style.width = '50px';
              carIcon.style.height = '50px';
              carIcon.style.cursor = 'pointer';

              carIcon.addEventListener('click', () => {
                this.IconClicked.emit(position)

              });

              const marker = new Marker({ element: carIcon })
                .setLngLat([position.position.longitude, position.position.latitude])
                .addTo(this.map!);

              // Mise à jour du marqueur suivi
              if (this.selectedDeviceId === deviceId) {
                this.updateCurrentDeviceMarker(marker, position);
              }

              console.log("deviceMarkers", this.deviceMarkers)
              this.deviceMarkers.set(deviceId, marker);
            });
          }



        }
      );
    });
  }
  }
  updateCurrentDeviceMarker(marker: Marker, position: any) {
    // Extraction sécurisée des coordonnées
    const lat = Number(position?.position?.latitude);
    const lon = Number(position?.position?.longitude);

    // Vérification que les coordonnées sont valides
    if (isNaN(lat) || isNaN(lon)) {
      console.error('Coordonnées invalides :', position);
      return; // On quitte la fonction si les coordonnées sont incorrectes
    }

    // Mise à jour ou création du marqueur
    if (this.currentDeviceMarker) {
      this.currentDeviceMarker.setLngLat([lon, lat]);
    } else {
      this.currentDeviceMarker = marker;
      this.currentDeviceMarker.setLngLat([lon, lat]);
    }

    // Centrage de la carte sur le marqueur
    if (this.map) {
      this.map.flyTo({
        center: [lon, lat],
        zoom: 15,
        speed: 1.2
      });
    }
  }




  ngOnDestroy() {
    this.map?.remove();
    this.deviceMarkers.forEach(marker => marker.remove());
    this.deviceMarkers.clear();
    if (this.positionsSubscription) {
      this.positionsSubscription.unsubscribe();
    }
    this.mapHomeService.disconnectWebSocket();
  }
}
