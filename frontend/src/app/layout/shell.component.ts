import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { StoreService } from '../core/store.service';
import { UiService } from '../core/ui.service';
import { typeLabel } from '../core/models';
import { StreamDialogComponent } from '../shared/stream-dialog.component';

@Component({
  selector: 'fv-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StreamDialogComponent],
  template: `
    <aside class="side">
      <div class="brand">
        <span class="logo"><i class="fa-solid fa-bolt"></i></span>
        <div><b>Fire<span>Volt</span></b><small>Surveillance intelligente</small></div>
      </div>

      <nav>
        <a routerLink="/dashboard" routerLinkActive="on"><i class="fa-solid fa-gauge-high"></i> Tableau de bord</a>
        @if (auth.isAdmin()) {
          <a routerLink="/supervisors" routerLinkActive="on"><i class="fa-solid fa-user-shield"></i> Superviseurs</a>
        }
        <a routerLink="/locals" routerLinkActive="on"><i class="fa-solid fa-warehouse"></i> Locaux électriques</a>
      </nav>

      <div class="me">
        <div class="avatar">{{ initials() }}</div>
        <div class="who">
          <b>{{ auth.user()?.name }}</b>
          <small>{{ auth.isAdmin() ? 'Administrateur' : 'Superviseur' }}</small>
        </div>
        <button class="out" (click)="logout()" title="Déconnexion"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    </aside>

    <main>
      <header class="top">
        <span class="live" [class.off]="!store.connected()">
          <i class="fa-solid fa-circle"></i> {{ store.connected() ? 'Temps réel connecté' : 'Reconnexion…' }}
        </span>
      </header>
      <section class="content"><router-outlet /></section>
    </main>

    <div class="toasts">
      @for (t of store.toasts(); track t.id) {
        <div class="toast" (click)="openFromToast(t.deviceId, t.id)">
          <i class="fa-solid fa-fire-flame-curved"></i>
          <div>
            <b>ALERTE · {{ t.deviceName }}</b>
            <span>{{ label(t.type) }} détecté(e) ({{ (t.confidence * 100).toFixed(0) }} %) — cliquer pour voir le flux</span>
          </div>
        </div>
      }
    </div>

    <fv-stream-dialog />
  `,
  styles: [`
    :host { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .side { background: linear-gradient(180deg, var(--navy), var(--navy-2)); color: #cfd9ea; display: flex; flex-direction: column; padding: 22px 14px; position: sticky; top: 0; height: 100vh; }
    .brand { display: flex; gap: 12px; align-items: center; padding: 0 8px 26px; }
    .logo { width: 42px; height: 42px; border-radius: 12px; background: var(--orange); color: #fff; display: grid; place-items: center; font-size: 20px; box-shadow: 0 6px 18px rgba(255,106,26,.45); }
    .brand b { font-size: 20px; color: #fff; display: block; } .brand b span { color: var(--orange); }
    .brand small { font-size: 11.5px; color: #8ea3c4; }
    nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    nav a { color: #b6c4dc; text-decoration: none; padding: 12px 14px; border-radius: 11px; display: flex; gap: 12px; align-items: center; font-weight: 600; transition: .15s; }
    nav a i { width: 18px; text-align: center; }
    nav a:hover { background: rgba(255,255,255,.07); color: #fff; }
    nav a.on { background: var(--orange); color: #fff; box-shadow: 0 6px 16px rgba(255,106,26,.35); }
    .me { display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,.06); padding: 10px; border-radius: 12px; }
    .avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; font-weight: 700; }
    .who { flex: 1; min-width: 0; } .who b { display: block; color: #fff; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .who small { color: #8ea3c4; }
    .out { background: none; border: 0; color: #b6c4dc; cursor: pointer; font-size: 16px; } .out:hover { color: var(--orange); }
    .top { display: flex; justify-content: flex-end; padding: 14px 28px 0; }
    .live { font-size: 12.5px; font-weight: 700; color: var(--ok); background: #e3f6ea; padding: 5px 12px; border-radius: 99px; }
    .live i { font-size: 7px; margin-right: 6px; } .live.off { color: var(--warn); background: #fff4db; }
    .content { padding: 10px 28px 40px; }
    .toasts { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 1500; }
    .toast { display: flex; gap: 14px; align-items: center; background: var(--danger); color: #fff; padding: 14px 18px; border-radius: 14px; box-shadow: 0 14px 40px rgba(225,29,72,.45); cursor: pointer; max-width: 380px; animation: in .3s; }
    .toast i { font-size: 24px; } .toast b { display: block; } .toast span { font-size: 12.5px; opacity: .92; }
    @keyframes in { from { transform: translateY(20px); opacity: 0; } }
    @media (max-width: 860px) { :host { grid-template-columns: 1fr; } .side { position: static; height: auto; flex-direction: row; flex-wrap: wrap; } nav { flex-direction: row; } .brand { padding: 0 8px; } }
  `],
})
export class ShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  store = inject(StoreService);
  private ui = inject(UiService);
  private router = inject(Router);
  label = typeLabel;

  ngOnInit() {
    this.store.start();
  }
  ngOnDestroy() {
    this.store.stop();
  }

  initials() {
    return (this.auth.user()?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  openFromToast(deviceId: number, eventId: number) {
    const l = this.store.locals().find((x) => x.id === deviceId);
    if (l) this.ui.openStream(l);
    this.store.dismissToast(eventId);
  }

  async logout() {
    this.store.stop();
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
