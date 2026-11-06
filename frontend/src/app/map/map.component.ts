import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import {Map, NavigationControl, Marker, Map as MapLibreMap} from 'maplibre-gl';
import { MapService } from '../services/map.service';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import {NzNotificationService} from 'ng-zorro-antd/notification';



@Component({
  selector: 'app-map',
  standalone: false,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {

  map: Map | undefined;
  marker: Marker | undefined;
  periodSub!: Subscription;
  selectedPeriod: string = 'today';
  deviceId: number | null = null;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(
    private mapService: MapService,
    private layoutService: LayoutService,
    private route: ActivatedRoute,
    private router: Router,
    private notification: NzNotificationService,
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
      if (this.map?.isStyleLoaded()) {
        this.loadRoute();
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialisation de la carte MapLibre
    const initialState = { lng: 10.1729, lat: 36.8702, zoom: 14 };

    this.map = new MapLibreMap({
      container: this.mapContainer.nativeElement as HTMLDivElement, // Le conteneur de la carte est l'élément DOM
      style: `https://tiles.stadiamaps.com/styles/osm_bright.json`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom
    });

    this.map.addControl(new NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.loadRoute();
    });
  }

  // Nettoyer les anciennes couches sur la carte
  private clearPreviousRoute(): void {
    if (this.map?.getSource('route')) {
      this.map.removeLayer('route');
      this.map.removeSource('route');
    }
    if (this.map?.getSource('points')) {
      this.map.removeLayer('points');
      this.map.removeSource('points');
    }
  }

  // Charger les données de trajet
  private loadRoute(): void {
    if (!this.deviceId) {
      console.error(" Aucun ID de véhicule fourni.");
      return;
    }

    if (!this.map || !this.map.isStyleLoaded()) {
      console.warn(" Carte non prête.");
      return;
    }

    const { from, to } = this.layoutService.getPeriodDates(this.selectedPeriod);
    this.clearPreviousRoute();

    if (this.marker) {
      this.marker.remove();
      this.marker = undefined;
    }

    // Appel du service pour récupérer les données de trajet
    this.mapService.getRouteReport(this.deviceId, from, to).subscribe((positions: any[]) => {
      if (!positions || positions.length === 0) {
        this.notification.create(
          'warning',
          'Aucune position trouvée pour cette période.',
          '',
          {nzDuration: 4000}
        );
        return;
      }

      console.log(" Positions reçues ");

      // Marqueur personnalisé
      const carIcon = document.createElement('img');
      carIcon.src = 'https://cdn-icons-png.flaticon.com/512/5412/5412275.png';
      carIcon.style.width = '40px';
      carIcon.style.height = '40px';

      const startPos = positions[0];
      this.marker = new Marker({ element: carIcon })
        .setLngLat([startPos.longitude, startPos.latitude])
        .addTo(this.map!);

      this.map?.flyTo({
        center: [startPos.longitude, startPos.latitude],
        essential: true
      });

      // Construction de la ligne GeoJSON à afficher
      const coordinates = positions.map(p => [p.longitude, p.latitude]);

      this.map?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {}
        }
      });

      this.map?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'green',
          'line-width': 4
        }
      });

      // Animation douce du marqueur
      this.animateMarkerSmoothly(positions);
    });
  }


  private animateMarkerSmoothly(positions: any[]): void {
    if (!this.marker || positions.length < 2 || !this.map) return;

    // Éliminer les positions dupliquées
    const filteredPositions = positions.filter((pos, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      return pos.latitude !== prev.latitude || pos.longitude !== prev.longitude;
    });

    if (filteredPositions.length < 2) return;

    let i = 0;
    const stepsPerSegment = 60; // Plus élevé = plus fluide
    const animate = () => {
      if (i >= filteredPositions.length - 1) return;

      const start = filteredPositions[i];
      const end = filteredPositions[i + 1];
      let step = 0;

      const animateStep = () => {
        if (!this.marker || !this.map) return;

        const progress = step / stepsPerSegment;
        const lng = start.longitude + (end.longitude - start.longitude) * progress;
        const lat = start.latitude + (end.latitude - start.latitude) * progress;

        const currentPosition: [number, number] = [lng, lat];


        // Déplacement du marqueur
        this.marker.setLngLat(currentPosition);

        // Faire suivre la carte au marqueur
        this.map.easeTo({
          center: currentPosition,
          duration: 100,
          easing: t => t
        });


        if (step < stepsPerSegment) {
          step++;
          requestAnimationFrame(animateStep);
        } else {
          i++;
          requestAnimationFrame(animate); // Lancer le prochain segment
        }
      };

      animateStep();
    };

    animate();
  }



  goToNotifications(): void {
    if (this.deviceId !== null) {
      this.router.navigate(['/notifications', this.deviceId]);
    }
  }


  ngOnDestroy(): void {
    this.periodSub?.unsubscribe();
    this.map?.remove();
  }
}
