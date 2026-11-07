import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { FvEvent, levelClass, levelLabel, typeIcon, typeLabel } from '../core/models';
import { StoreService } from '../core/store.service';

@Component({
  selector: 'fv-history',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Historique · {{ local()?.name ?? 'Local #' + id() }}</h1>
        <p class="sub">{{ local()?.region }} {{ local()?.address ? '· ' + local()!.address : '' }}</p>
      </div>
      <a class="btn" routerLink="/locals" style="text-decoration:none"><i class="fa-solid fa-arrow-left"></i> Retour aux locaux</a>
    </div>

    <div class="stats">
      <div class="card stat"><div class="ico rd"><i class="fa-solid fa-fire-flame-curved"></i></div><div><b>{{ count('alert') }}</b><span>Alertes</span></div></div>
      <div class="card stat"><div class="ico or"><i class="fa-solid fa-triangle-exclamation"></i></div><div><b>{{ count('suspect') }}</b><span>Détections suspectes</span></div></div>
    </div>

    <div class="card">
      <div class="toolbar">
        <select class="input" [ngModel]="type()" (ngModelChange)="type.set($event)">
          <option value="">Tous les types</option><option value="fire">Feu</option><option value="smoke">Fumée</option><option value="spark">Étincelle</option>
        </select>
        <select class="input" [ngModel]="level()" (ngModelChange)="level.set($event)">
          <option value="">Tous les niveaux</option><option value="alert">Alerte</option><option value="suspect">Suspect</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date et heure</th><th>Type</th><th>Niveau</th><th>Confiance</th></tr></thead>
          <tbody>
            @for (e of filtered(); track e.id) {
              <tr>
                <td>{{ e.eventTime | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                <td><i class="fa-solid" [class]="icon(e.type)" style="color:var(--orange);margin-right:8px"></i>{{ label(e.type) }}</td>
                <td><span class="badge" [class]="levelClass(e.level)">{{ levelLabel(e.level) }}</span></td>
                <td>{{ (e.confidence * 100).toFixed(0) }} %</td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty">Aucune détection enregistrée pour ce local.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class HistoryComponent implements OnInit {
  id = input.required<string>(); // :id (withComponentInputBinding)
  private api = inject(ApiService);
  private store = inject(StoreService);

  rows = signal<FvEvent[]>([]);
  type = signal('');
  level = signal('');
  local = computed(() => this.store.locals().find((l) => l.id === +this.id()));
  filtered = computed(() => this.rows().filter((e) => (!this.type() || e.type === this.type()) && (!this.level() || e.level === this.level())));

  levelClass = levelClass;
  levelLabel = levelLabel;
  label = typeLabel;
  icon = typeIcon;

  constructor() {
    // nouvelle détection en direct sur ce local => ajoutée en haut du tableau
    effect(() => {
      const e = this.store.events()[0];
      if (e && e.deviceId === +this.id() && !this.rows().some((r) => r.id === e.id)) {
        this.rows.update((r) => [e, ...r]);
      }
    });
  }

  async ngOnInit() {
    this.rows.set(await this.api.events({ deviceId: +this.id(), limit: 500 }));
  }

  count = (lvl: string) => this.rows().filter((e) => e.level === lvl).length;
}
