import {Component, EventEmitter, OnChanges ,inject, Input, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {MapHomeService} from '../../services/map-home.service';
import {Device} from '../../models/models.model';
import * as turf from '@turf/turf';
import {GeofenceService} from '../../services/geofence.service';
type Type = 'Zone identifié' | 'Zone autorisé';

@Component({
  selector: 'app-geofence',
  standalone: false,
  templateUrl: './geofence.component.html',
  styleUrl: './geofence.component.scss'
})
export class GeofenceComponent implements  OnChanges{

  @Input() visible = false;
  @Input() device!: Device | null;
  @Input() map: any;
  @Output() closeDrawer = new EventEmitter<void>();
  @Input() markerLngLat!: any;
  @Input() GeofenceVisible= false;
  @Input() formDirectVisible = false;
  @Output() addGeofence = new EventEmitter<void>();
  geofences: any[] = [];
  FormVisible = false;
  private fb = inject(FormBuilder);

  constructor(
              private mapHomeService: MapHomeService,
              private geofenceService:GeofenceService) {}

  validateForm = this.fb.group({
    nom: this.fb.control<string | null>(null, Validators.required),
    type: this.fb.control<Type | null>(null, Validators.required),
    radius: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)])
  });

  deleteGeofence(id: number) {
    console.log('Suppression de la geofence avec ID', id);
    this.geofenceService.deleteGeofence(id).subscribe(
      {
        next: () => {
          //  Supprimer la geofence de la carte
          const layerId = `geofence-${id}`;
          const sourceId = `geofence-source-${id}`;
          if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
          if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);

          //  Supprimer la geofence du tableau local
          this.geofences = this.geofences.filter(g => g.id !== id);

          console.log("geofence supprimer", id)
        },
        error: (err) => console.error("Erreur suppression geofence", err)
      });
  }

  trackByGeofenceId(index: number, geofence: any): number {
    return geofence.id; // Utilisez un identifiant unique pour chaque geofence.
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['device'] && changes['device'].currentValue) {
      this.clearPreviousGeofencesFromMap();
      if (this.device?.id) {
        this.loadGeofences(this.device.id);
      }
    }
    if (changes['formDirectVisible']) {
      this.FormVisible = this.formDirectVisible;
    }
  }

  close(): void {
    this.closeDrawer.emit();
  }


  loadGeofences(deviceId: number): void {
    console.log('Chargement des geofences pour deviceId:', deviceId);

    this.mapHomeService.getGeofencesByDeviceId(deviceId).subscribe(
      (data) => {
        this.geofences = data;
        console.log('Geofences récupérés:', data);
        this.geofences.forEach(geofence => this.drawOneGeofenceOnMap(geofence));


      }
    )}

  AddGeofence(){

    if (!this.markerLngLat || !this.validateForm.valid || !this.device) {
      return;
    }
    const lng = this.markerLngLat.lng;
    const lat = this.markerLngLat.lat;
    const radius = this.validateForm.get('radius')?.value;
    const name = this.validateForm.get('type')?.value;
    const description = this.validateForm.get('nom')?.value;

    const geofence = {
      name: name,
      description: description,
      area: `CIRCLE(${lng} ${lat}, ${radius})`,
      calendarId: null
    };
    this.mapHomeService.createGeofence(geofence).subscribe({
      next: (response) => {
        const geofenceId = response.id;
        const deviceId = this.device!.id;
        this.mapHomeService.linkDeviceToGeofence(deviceId, geofenceId).subscribe(() => {
          const fullGeofence = { ...geofence, id: geofenceId }; //contient toute les information du geofence avec leur geofenceId
          this.geofences.push(fullGeofence); // ajout du nouvelle zone Geofence au tableau geofences
          this.drawOneGeofenceOnMap(fullGeofence);


        });
        this.addGeofence.emit(); //pour informer de fermer le drawer
        console.log("addgeofence", geofence);


      },
      error: (error) => {
        console.error(error);
      }
    });
  }


  AjouterForm(): void {
    if (this.validateForm.valid && this.device) {
      this.AddGeofence();
      this.FormVisible = false;
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
    }
  }

  drawOneGeofenceOnMap(geofence: any): void {
    if (!this.map) {
      console.warn('Map is undefined when trying to draw geofence');
      return; //la fonction arréte
    }

    //extraire lng , lat raduis du area
    const match = geofence.area.match(/CIRCLE\(([-\d.]+) ([-\d.]+),\s?(\d+)\)/);

    if (!match) return; //arrete si le format ne correspond pas

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    const radius = parseFloat(match[3]);

    const id = geofence.id;
    const layerId = `geofence-${id}`; // identifiant pour la couche affichée sur la carte
    const sourceId = `geofence-source-${id}`; //identifiant de la source GeoJSON qui contient la forme du cercle

    //supprime d'abord les anciennes couches/sources avec ces IDs

    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);

    const circle = turf.circle([lng, lat], radius, { steps: 64, //determine combient de (points) seront utilisés pour dessiner le cercle.
      units: 'meters' });

    //ajout de la source à la carte
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: circle
    });

    let Color = '#00FF00';
    if (geofence.name === 'Zone autorisé') {
      Color = '#D2B48C';
    }
    this.map.addLayer({
      id: layerId,
      type: 'fill', //remplissage
      source: sourceId,
      layout: {},
      paint: {
        'fill-color':Color,
        'fill-opacity': 0.5
      }
    });

    //zoomer autour de la geofence
    this.map.fitBounds([
      [lng - 0.01, lat - 0.01],
      [lng + 0.01, lat + 0.01]
    ], { padding: 20 });
  }


  clearPreviousGeofencesFromMap(): void {
    if (!this.map) return;

    // Supprimer toutes les couches et sources qui commencent par "geofence-"
    const layers = this.map.getStyle().layers;
    if (!layers) return;

    layers.forEach((layer: any) => {
      if (layer.id.startsWith('geofence-')) {
        if (this.map.getLayer(layer.id)) {
          this.map.removeLayer(layer.id);
        }
      }
    });

    const sources = this.map.getStyle().sources;
    Object.keys(sources).forEach(sourceId => {
      if (sourceId.startsWith('geofence-source-')) {
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
        }
      }
    });

    this.geofences = [];
  }


}

