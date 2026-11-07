import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { levelClass, levelLabel, typeIcon, typeLabel } from '../core/models';
import { StoreService } from '../core/store.service';
import { UiService } from '../core/ui.service';
import { MapComponent } from '../shared/map.component';

@Component({
  selector: 'fv-dashboard',
  imports: [MapComponent, DatePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>Bonjour, {{ auth.user()?.name }}</h1>
        <p class="sub">{{ auth.isAdmin() ? 'Vue globale de la plateforme' : 'Vue de vos régions : ' + (auth.user()?.regions || '—') }}</p>
      </div>
    </div>

    <div class="stats">
      @if (auth.isAdmin()) {
        <div class="card stat"><div class="ico"><i class="fa-solid fa-user-shield"></i></div><div><b>{{ supervisors() }}</b><span>Superviseurs créés</span></div></div>
        <div class="card stat"><div class="ico or"><i class="fa-solid fa-warehouse"></i></div><div><b>{{ store.locals().length }}</b><span>Locaux électriques</span></div></div>
      } @else {
        @for (r of byRegion(); track r.region) {
          <div class="card stat"><div class="ico or"><i class="fa-solid fa-location-dot"></i></div><div><b>{{ r.count }}</b><span>Locaux · {{ r.region }}</span></div></div>
        }
      }
      <div class="card stat"><div class="ico gr"><i class="fa-solid fa-signal"></i></div><div><b>{{ online() }}</b><span>Caméras en ligne</span></div></div>
      <div class="card stat"><div class="ico rd"><i class="fa-solid fa-fire-flame-curved"></i></div><div><b>{{ alerts() }}</b><span>Alertes actives</span></div></div>
    </div>

    <div class="grid2">
      <div class="card" style="padding:10px">
        <fv-map [locals]="store.locals()" (stream)="ui.openStream($event)" />
      </div>

      <div class="card">
        <h2>Dernières détections</h2>
        @for (e of store.events().slice(0, 8); track e.id) {
          <div class="ev">
            <span class="ico" [class]="levelClass(e.level)"><i class="fa-solid" [class]="icon(e.type)"></i></span>
            <div>
              <b>{{ e.deviceName }}</b>
              <small>{{ label(e.type) }} · {{ (e.confidence * 100).toFixed(0) }} % · {{ e.eventTime | date: 'dd/MM HH:mm:ss' }}</small>
            </div>
            <span class="badge" [class]="levelClass(e.level)">{{ levelLabel(e.level) }}</span>
          </div>
        } @empty {
          <div class="empty"><i class="fa-solid fa-shield-heart" style="font-size:30px"></i><p>Aucune détection récente.<br />Tout est calme.</p></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ev { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .ev:last-child { border: 0; } .ev > div { flex: 1; min-width: 0; } .ev b { display: block; font-size: 13.5px; } .ev small { color: var(--muted); }
    .ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; }
    .ico.ok { background: #e3f6ea; color: var(--ok); } .ico.warn { background: #fff4db; color: #b97700; } .ico.danger { background: #fde8ee; color: var(--danger); }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  store = inject(StoreService);
  ui = inject(UiService);
  private api = inject(ApiService);

  supervisors = signal(0);
  online = computed(() => this.store.locals().filter((l) => l.status === 'online').length);
  alerts = computed(() => this.store.locals().filter((l) => l.alertLevel === 'alert').length);
  byRegion = computed(() => {
    const m = new Map<string, number>();
    this.store.locals().forEach((l) => m.set(l.region || '—', (m.get(l.region || '—') ?? 0) + 1));
    return [...m].map(([region, count]) => ({ region, count }));
  });

  levelClass = levelClass;
  levelLabel = levelLabel;
  label = typeLabel;
  icon = typeIcon;

  async ngOnInit() {
    if (this.auth.isAdmin()) this.supervisors.set((await this.api.stats()).supervisors ?? 0);
  }
}
