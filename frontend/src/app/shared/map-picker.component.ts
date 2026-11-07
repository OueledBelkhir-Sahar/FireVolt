import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

/** Mini-carte : cliquer pour fixer l'emplacement exact d'un local. */
@Component({
  selector: 'fv-map-picker',
  template: `<div #host class="picker"></div>`,
  styles: [`.picker { height: 240px; border-radius: 12px; border: 1px solid var(--line); z-index: 0; }`],
})
export class MapPickerComponent implements AfterViewInit, OnDestroy {
  lat = input<number>(0);
  lon = input<number>(0);
  picked = output<{ lat: number; lon: number }>();
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit() {
    const has = this.lat() !== 0 || this.lon() !== 0;
    this.map = L.map(this.host().nativeElement).setView(has ? [this.lat(), this.lon()] : [34.2, 9.5], has ? 16 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map);
    if (has) this.place(this.lat(), this.lon());
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = +e.latlng.lat.toFixed(6);
      const lon = +e.latlng.lng.toFixed(6);
      this.place(lat, lon);
      this.picked.emit({ lat, lon });
    });
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private place(lat: number, lon: number) {
    const icon = L.divIcon({ className: '', html: '<div class="fv-pin"><i class="fa-solid fa-bolt"></i></div>', iconSize: [38, 38], iconAnchor: [19, 38] });
    this.marker ? this.marker.setLatLng([lat, lon]) : (this.marker = L.marker([lat, lon], { icon }).addTo(this.map!));
  }
}
