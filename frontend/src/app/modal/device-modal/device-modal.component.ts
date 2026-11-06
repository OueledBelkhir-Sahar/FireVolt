import {Component, EventEmitter, Input, Output,  OnChanges} from '@angular/core';
import {Device, Position} from '../../models/models.model';
import {AuthentificationsService} from '../../services/authentifications.service';

@Component({
  selector: 'app-device-modal',
  standalone: false,
  templateUrl: './device-modal.component.html',
  styleUrl: './device-modal.component.scss'
})
export class DeviceModalComponent  {
  @Input() map: any;
  @Input() Modalvisible = false;
  @Input() device!: Device;
  @Output() close = new EventEmitter<void>();
  @Input() position!: Position;
  @Output() openGeofence = new EventEmitter<number>();

  constructor(public authentificationsService: AuthentificationsService) {}
  handleCancel() {
    this.close.emit();
  }

  openGeofenceDrawer() {

    this.Modalvisible = false;
    this.openGeofence.emit(this.position.deviceId);

  }
}
/*

import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  Input,Output, EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import * as turf from '@turf/turf';
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import { Subscription } from 'rxjs';
import { MapHomeService } from '../../services/map-home.service';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

type Type = 'Zone identifié' | 'Zone autorisé';

@Component({
  selector: 'app-map-home',
  standalone: false,
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss']
})
export class MapHomeComponent implements AfterViewInit, OnDestroy {
  map: MapLibreMap | undefined; // Pour stocker l'objet carte
  private deviceMarkers: Map<number, Marker> = new Map<number, Marker>();
  private positionsSubscription: Subscription | undefined;
  private currentDeviceMarker: Marker | null = null; // Pour stocker le marqueur du device suivi

  @ViewChild('map') private mapContainer!: ElementRef<HTMLElement>;

  @Input() selectedDeviceId: number | null = null;

  @Input() resetMapView: boolean = false;
  @Output() mapResetDone = new EventEmitter<void>();

  modalVisible = false;
  selectedDevice: any = null;
  addingGeofence = false;
  selectedGeofenceDevice: any = null;

  tempShapeId: string | null = null; // Pour stocker l'id du cercle ou polygone temporaire

  constructor(
    private mapHomeService: MapHomeService,
    private http: HttpClient
  ) {}

  /*ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDeviceId'] && this.selectedDeviceId !== null) {
      this.centerMapOnDevice(this.selectedDeviceId);
    }
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

  // Gestion clic sur la carte pour dessiner une geofence
  this.map.on('click', (e) => {
    if (this.addingGeofence) {
      const center = [e.lngLat.lng, e.lngLat.lat];
      const radiusInMeters = this.validateForm.value.radius || 800;

      // Supprimer le cercle ou le polygone précédent s'il existe
      if (this.tempShapeId && this.map!.getSource(this.tempShapeId)) {
        this.map!.removeLayer(this.tempShapeId);
        this.map!.removeSource(this.tempShapeId);
      }

      const shapeId = `shape-${Date.now()}`;
      this.tempShapeId = shapeId;

      // Zone identifié - Cercle autour du centre
      const circle = turf.circle(center, radiusInMeters, {
        steps: 64,  // Plus de steps, cercle plus lisse
        units: 'meters'
      });

      // Ajouter la source du cercle
      this.map!.addSource(shapeId, {
        type: 'geojson',
        data: circle
      });

      // Ajouter la couche cercle
      this.map!.addLayer({
        id: shapeId,
        type: 'fill',
        source: shapeId,
        paint: {
          'fill-color': '#3b9ddd',
          'fill-opacity': 0.4
        }
      });

      const area = `CIRCLE(${center[0]} ${center[1]}, ${radiusInMeters})`;

      // Envoi de la géofence à l'API
      this.createGeofence(area, 'Zone identifiée autour du dépôt');
    }
  });

  this.map.on('load', () => {
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

          const deviceData = {
            deviceId: deviceId,
            name: position.deviceName,
            uniqueId: position.uniqueId,
            model: position.model,
            nameDriver: position.nameDriver,
            latitude: position.latitude,
            longitude: position.longitude,
            speed: position.speed,
            distance: position.attributes?.totalDistance,
            battery: position.attributes?.batteryLevel,
            status: position.status
          };

          carIcon.addEventListener('click', () => {
            this.showModal(deviceData);
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

showModal(device?: any): void {
  this.selectedDevice = device ?? null;
  this.modalVisible = true;
}

handleCancel(): void {
  this.modalVisible = false;
}

visibleGeofence = false;

showGeofence(): void {
  this.modalVisible = false;
  this.visibleGeofence = true;
  if (this.selectedDevice) {
  this.loadGeofences(this.selectedDevice.deviceId);
}
}

geofences: any[] = [];

loadGeofences(deviceId: number): void {
  this.mapHomeService.getGeofencesByDeviceId(deviceId).subscribe(
    (data) => {
      this.geofences = data;

      // Ajouter chaque géofence sur la carte
      this.geofences.forEach((geofence: any) => {
        const { area, name } = geofence;

        // Extraire les coordonnées du centre et le rayon
        const match = /CIRCLE\((-?\d+\.\d+) (-?\d+\.\d+), (\d+)\)/.exec(area);
        if (match) {
          const lng = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          const radiusInMeters = parseInt(match[3], 10);

          // Créer le cercle en utilisant turf
          const circle = turf.circle([lng, lat], radiusInMeters, {
            steps: 64,  // Plus de steps, cercle plus lisse
            units: 'meters'
          });

          // Ajouter la source du cercle à la carte
          const shapeId = `geofence-${geofence.id}`;
          this.map!.addSource(shapeId, {
            type: 'geojson',
            data: circle
          });

          // Ajouter la couche pour afficher le cercle
          this.map!.addLayer({
            id: shapeId,
            type: 'fill',
            source: shapeId,
            paint: {
              'fill-color': 'green',
              'fill-opacity': 0.4
            }
          });
        }
      });
    },
    (error) => {
      console.error('Erreur lors du chargement des geofences', error);
    }
  );
}



startAddGeofence(device: any): void {
  this.modalVisible = false;
  this.addingGeofence = true;
  this.selectedGeofenceDevice = device;
  alert('Clique sur la carte pour choisir le centre de la zone géofence');
}

close(): void {
  this.visibleGeofence = false;
}

FormVisible = false;

ShowForm() {
  this.FormVisible = !this.FormVisible;
}

private fb = inject(FormBuilder);

validateForm = this.fb.group({
  nom: this.fb.control<string | null>(null, Validators.required),
  type: this.fb.control<Type | null>(null, Validators.required),
  radius: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),  // Rayon en mètres
});

AjoutertForm(): void {
  if (this.validateForm.valid && this.selectedDevice) {
  this.startAddGeofence(this.selectedDevice);
  this.FormVisible = false;
  this.visibleGeofence = false;
} else {
  Object.values(this.validateForm.controls).forEach(control => {
    if (control.invalid) {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    }
  });
}
}

createGeofence(area: string, description: string): void {
  const newGeofence = {
    name: this.validateForm.value.nom,
    area: area,
    description: description,
    calendarId: 0
  };

  this.http.post('http://localhost:8082/api/geofences', newGeofence).subscribe({
    next: (response: any) => {
      this.http.post('http://localhost:8082/api/permissions', {
        deviceId: this.selectedGeofenceDevice.deviceId,
        geofenceId: response.id
      }).subscribe(() => {
        alert('Zone ajoutée avec succès !');
        this.resetTempShape();
        this.addingGeofence = false;
        this.selectedGeofenceDevice = null;
      });
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de la création de la zone');
      this.resetTempShape();
      this.addingGeofence = false;
      this.selectedGeofenceDevice = null;
    }
  });
}

resetTempShape(): void {
  if (this.tempShapeId && this.map!.getSource(this.tempShapeId)) {
  this.map!.removeLayer(this.tempShapeId);
  this.map!.removeSource(this.tempShapeId);
  this.tempShapeId = null;
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

 */

