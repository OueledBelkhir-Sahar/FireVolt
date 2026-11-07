import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Local, levelClass, levelLabel, regionsOf } from '../core/models';
import { StoreService } from '../core/store.service';
import { UiService } from '../core/ui.service';
import { MapPickerComponent } from '../shared/map-picker.component';

@Component({
  selector: 'fv-locals',
  imports: [FormsModule, RouterLink, MapPickerComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>Gestion des locaux électriques</h1>
        <p class="sub">{{ filtered().length }} local(aux)</p>
      </div>
      <button class="btn primary" (click)="openForm()"><i class="fa-solid fa-plus"></i> Nouveau local</button>
    </div>

    <div class="card">
      <div class="toolbar">
        <input class="input" placeholder="Rechercher (nom, id, adresse)…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        <select class="input" [ngModel]="region()" (ngModelChange)="region.set($event)">
          <option value="">Toutes les régions</option>
          @for (r of allRegions(); track r) { <option [value]="r">{{ r }}</option> }
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Nom</th><th>Localisation exacte</th><th>Région</th><th>État</th><th>Flux / Historique</th><th></th></tr></thead>
          <tbody>
            @for (l of filtered(); track l.id) {
              <tr>
                <td class="mono">{{ l.uniqueId }}</td>
                <td><b>{{ l.name }}</b></td>
                <td>{{ l.address || '—' }}<br /><span class="mono">{{ l.latitude }}, {{ l.longitude }}</span></td>
                <td><span class="chip">{{ l.region }}</span></td>
                <td>
                  @if (l.alertLevel !== 'normal') { <span class="badge" [class]="levelClass(l.alertLevel)">{{ levelLabel(l.alertLevel) }}</span> }
                  @else if (l.status === 'offline') { <span class="badge off">Hors ligne</span> }
                  @else if (l.status === 'unknown') { <span class="badge off">Sans caméra</span> }
                  @else { <span class="badge ok">Normal</span> }
                </td>
                <td>
                  <div class="actions" style="justify-content:flex-start">
                    <button class="btn blue" style="padding:6px 12px" (click)="ui.openStream(l)"><i class="fa-solid fa-video"></i> Stream</button>
                    <a class="btn" style="padding:6px 12px;text-decoration:none" [routerLink]="['/locals', l.id, 'history']"><i class="fa-solid fa-clock-rotate-left"></i> Historique</a>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button class="icon-btn" title="Modifier" (click)="openForm(l)"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn del" title="Supprimer" (click)="remove(l)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">Aucun local.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (form(); as f) {
      <div class="backdrop" (click)="form.set(null)">
        <form class="modal wide" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="modal-head">
            <h2>{{ f.id ? 'Modifier le local' : 'Nouveau local électrique' }}</h2>
            <button type="button" class="icon-btn" (click)="form.set(null)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="form-grid">
            <div><label class="f">Nom du local</label><input class="input" name="name" [(ngModel)]="f.name" required /></div>
            <div><label class="f">Identifiant unique</label><input class="input" name="uid" [(ngModel)]="f.uniqueId" required placeholder="LOC-TUN-002" /></div>
            <div>
              <label class="f">Région</label>
              @if (auth.isAdmin()) {
                <input class="input" name="region" [(ngModel)]="f.region" list="regions" required />
                <datalist id="regions">@for (r of allRegions(); track r) { <option [value]="r"></option> }</datalist>
              } @else {
                <select class="input" name="region" [(ngModel)]="f.region" required>
                  @for (r of myRegions(); track r) { <option [value]="r">{{ r }}</option> }
                </select>
              }
            </div>
            <div><label class="f">Adresse</label><input class="input" name="address" [(ngModel)]="f.address" /></div>
            <div class="full">
              <label class="f">Emplacement exact — cliquez sur la carte</label>
              <fv-map-picker [lat]="f.latitude ?? 0" [lon]="f.longitude ?? 0" (picked)="onPick($event)" />
            </div>
            <div><label class="f">Latitude</label><input class="input" type="number" step="any" name="lat" [(ngModel)]="f.latitude" required /></div>
            <div><label class="f">Longitude</label><input class="input" type="number" step="any" name="lon" [(ngModel)]="f.longitude" required /></div>
            <div class="full">
              <label class="f">Source caméra</label>
              <input class="input" name="cam" [(ngModel)]="f.cameraSource" placeholder="0 (webcam) · rtsp://… · http://IP:81/stream" />
              <div class="hint">Webcam du serveur : 0 · caméra IP : URL RTSP · ESP32-CAM : URL du flux MJPEG.</div>
            </div>
          </div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div class="modal-foot">
            <button type="button" class="btn" (click)="form.set(null)">Annuler</button>
            <button class="btn primary" [disabled]="saving()">Enregistrer</button>
          </div>
        </form>
      </div>
    }
  `,
})
export class LocalsComponent {
  auth = inject(AuthService);
  ui = inject(UiService);
  private store = inject(StoreService);
  private api = inject(ApiService);

  q = signal('');
  region = signal('');
  form = signal<Partial<Local> | null>(null);
  error = signal('');
  saving = signal(false);
  levelClass = levelClass;
  levelLabel = levelLabel;

  myRegions = computed(() => regionsOf(this.auth.user()));
  allRegions = computed(() => [...new Set(this.store.locals().map((l) => l.region).filter(Boolean))].sort());
  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.store.locals().filter(
      (l) => (!this.region() || l.region === this.region()) && (!q || `${l.name} ${l.uniqueId} ${l.address}`.toLowerCase().includes(q)),
    );
  });

  openForm(l?: Local) {
    this.error.set('');
    this.form.set(
      l ? { ...l } : { name: '', uniqueId: '', region: this.myRegions()[0] ?? '', address: '', latitude: 0, longitude: 0, cameraSource: '' },
    );
  }

  onPick(p: { lat: number; lon: number }) {
    this.form.update((f) => (f ? { ...f, latitude: p.lat, longitude: p.lon } : f));
  }

  async save() {
    const f = this.form();
    if (!f) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const saved = f.id ? await this.api.updateDevice(f) : await this.api.createDevice(f);
      this.store.upsert(saved);
      this.form.set(null);
    } catch (e: any) {
      this.error.set(e?.error?.detail ?? "Erreur lors de l'enregistrement.");
    } finally {
      this.saving.set(false);
    }
  }

  async remove(l: Local) {
    if (!confirm(`Supprimer le local « ${l.name} » et son historique ?`)) return;
    await this.api.deleteDevice(l.id);
    this.store.remove(l.id);
  }
}
