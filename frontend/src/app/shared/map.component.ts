import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Local, levelClass, levelLabel } from '../core/models';

const hasCoords = (l: Local) => !(l.latitude === 0 && l.longitude === 0);

/** Carte des locaux : clic sur un pin => zoom sur le local + popup avec bouton "Voir le stream". */
@Component({
  selector: 'fv-map',
  template: `<div #host class="map"></div>`,
  styles: [`:host { display: block; height: 100%; } .map { height: 100%; min-height: 440px; border-radius: 12px; z-index: 0; }`],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  locals = input.required<Local[]>();
  stream = output<Local>();
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private map?: L.Map;
  private markers = new Map<number, L.Marker>();
  private byId = new Map<number, Local>();
  private fitted = false;

  constructor() {
    effect(() => {
      const list = this.locals();
      if (this.map) this.sync(list);
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.host().nativeElement).setView([34.2, 9.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);
    this.sync(this.locals());
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private icon(l: Local) {
    const cls = l.alertLevel !== 'normal' ? levelClass(l.alertLevel) : l.status === 'offline' ? 'off' : 'ok';
    return L.divIcon({
      className: '',
      html: `<div class="fv-pin ${cls}"><i class="fa-solid fa-bolt"></i></div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  }

  private sync(list: Local[]) {
    if (!this.map) return;
    const seen = new Set<number>();
    this.byId.clear();
    for (const l of list.filter(hasCoords)) {
      seen.add(l.id);
      this.byId.set(l.id, l);
      const pos: L.LatLngExpression = [l.latitude, l.longitude];
      const existing = this.markers.get(l.id);
      if (existing) {
        existing.setLatLng(pos).setIcon(this.icon(l));
      } else {
        const m = L.marker(pos, { icon: this.icon(l) }).addTo(this.map);
        m.on('click', () => this.focus(l.id));
        this.markers.set(l.id, m);
      }
    }
    for (const [id, m] of this.markers) {
      if (!seen.has(id)) {
        m.remove();
        this.markers.delete(id);
      }
    }
    if (!this.fitted && seen.size) {
      this.fitted = true;
      this.map.fitBounds(L.latLngBounds([...this.markers.values()].map((m) => m.getLatLng())), { padding: [60, 60], maxZoom: 13 });
    }
  }

  private focus(id: number) {
    const l = this.byId.get(id);
    const m = this.markers.get(id);
    if (!l || !m || !this.map) return;
    this.map.flyTo([l.latitude, l.longitude], 17, { duration: 1.1 });

    const box = document.createElement('div');
    box.className = 'fv-popup';
    const level = l.alertLevel;
    box.innerHTML = `<b></b><small></small>
      <span class="badge ${levelClass(level)}">${levelLabel(level)}</span>
      <button type="button"><i class="fa-solid fa-video"></i>&nbsp; Voir le stream</button>`;
    box.querySelector('b')!.textContent = l.name;
    box.querySelector('small')!.textContent = `${l.region} · ${l.address || 'Adresse non renseignée'}`;
    box.querySelector('button')!.addEventListener('click', () => this.stream.emit(l));
    m.unbindPopup().bindPopup(box).openPopup();
  }
}
