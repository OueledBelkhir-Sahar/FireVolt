import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { User, regionsOf } from '../core/models';

@Component({
  selector: 'fv-supervisors',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Gestion des superviseurs</h1>
        <p class="sub">{{ rows().length }} superviseur(s) créé(s) par votre compte</p>
      </div>
      <button class="btn primary" (click)="openForm()"><i class="fa-solid fa-plus"></i> Nouveau superviseur</button>
    </div>

    <div class="card">
      <div class="toolbar">
        <input class="input" placeholder="Rechercher (nom, e-mail, région)…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Région(s) de travail</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr>
                <td><b>{{ u.name }}</b></td>
                <td>{{ u.email }}</td>
                <td>@for (r of regions(u); track r) { <span class="chip">{{ r }}</span> } @empty { <span class="mono">—</span> }</td>
                <td><span class="badge" [class]="u.disabled ? 'off' : 'ok'">{{ u.disabled ? 'Désactivé' : 'Actif' }}</span></td>
                <td>
                  <div class="actions">
                    <button class="icon-btn" title="Modifier" (click)="openForm(u)"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn del" title="Supprimer" (click)="remove(u)"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">Aucun superviseur.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (form(); as f) {
      <div class="backdrop" (click)="form.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="modal-head">
            <h2>{{ f.id ? 'Modifier le superviseur' : 'Nouveau superviseur' }}</h2>
            <button type="button" class="icon-btn" (click)="form.set(null)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="form-grid">
            <div class="full"><label class="f">Nom complet</label><input class="input" name="name" [(ngModel)]="f.name" required /></div>
            <div class="full"><label class="f">E-mail</label><input class="input" type="email" name="email" [(ngModel)]="f.email" required /></div>
            <div class="full">
              <label class="f">Région(s) de travail</label>
              <input class="input" name="regions" [(ngModel)]="f.regions" placeholder="Tunis, Bizerte" />
              <div class="hint">Séparez plusieurs régions par une virgule. Le superviseur ne verra que les locaux de ces régions.</div>
            </div>
            <div class="full">
              <label class="f">Mot de passe {{ f.id ? '(laisser vide pour ne pas changer)' : '' }}</label>
              <input class="input" type="password" name="password" [(ngModel)]="f.password" [required]="!f.id" minlength="6" autocomplete="new-password" />
            </div>
            <div class="full"><label><input type="checkbox" name="disabled" [(ngModel)]="f.disabled" /> Compte désactivé</label></div>
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
export class SupervisorsComponent implements OnInit {
  private api = inject(ApiService);
  rows = signal<User[]>([]);
  q = signal('');
  form = signal<Partial<User> | null>(null);
  error = signal('');
  saving = signal(false);
  regions = (u: User) => regionsOf(u);

  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.rows().filter((u) => !q || `${u.name} ${u.email} ${u.regions}`.toLowerCase().includes(q));
  });

  async ngOnInit() {
    this.rows.set(await this.api.users());
  }

  openForm(u?: User) {
    this.error.set('');
    this.form.set(u ? { ...u, password: '' } : { name: '', email: '', regions: '', password: '', disabled: false });
  }

  async save() {
    const f = this.form();
    if (!f) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const saved = f.id ? await this.api.updateUser(f) : await this.api.createUser(f);
      this.rows.update((l) => (f.id ? l.map((x) => (x.id === saved.id ? saved : x)) : [...l, saved]));
      this.form.set(null);
    } catch (e: any) {
      this.error.set(e?.error?.detail ?? "Erreur lors de l'enregistrement.");
    } finally {
      this.saving.set(false);
    }
  }

  async remove(u: User) {
    if (!confirm(`Supprimer le superviseur « ${u.name} » ?`)) return;
    await this.api.deleteUser(u.id);
    this.rows.update((l) => l.filter((x) => x.id !== u.id));
  }
}
