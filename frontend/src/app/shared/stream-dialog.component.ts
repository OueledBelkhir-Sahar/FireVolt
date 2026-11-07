import { Component, computed, effect, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { levelClass, levelLabel } from '../core/models';
import { StoreService } from '../core/store.service';
import { UiService } from '../core/ui.service';

/** Flux MJPEG annoté par YOLO, affiché dans une simple balise <img>. */
@Component({
  selector: 'fv-stream-dialog',
  template: `
    @if (ui.streamLocal(); as l) {
      <div class="backdrop" (click)="ui.closeStream()">
        <div class="modal wide" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div>
              <h2>{{ l.name }}</h2>
              <span class="mono">{{ l.region }} · {{ l.address }}</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
              <span class="badge" [class]="cls()">{{ label() }}</span>
              <button class="icon-btn" (click)="ui.closeStream()"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
          <div class="screen" [class.alert]="level() === 'alert'">
            @if (failed()) {
              <div class="fail">
                <i class="fa-solid fa-video-slash"></i>
                <p>Flux indisponible. Vérifiez la source caméra du local.</p>
                <button class="btn blue" (click)="retry()">Réessayer</button>
              </div>
            } @else {
              <img [src]="src()" alt="Flux en direct" (error)="failed.set(true)" />
              <span class="live"><i class="fa-solid fa-circle"></i> LIVE · IA</span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .screen { position: relative; background: #000; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; display: grid; place-items: center; border: 3px solid transparent; }
    .screen.alert { border-color: var(--danger); box-shadow: 0 0 0 4px rgba(225,29,72,.25); }
    img { width: 100%; height: 100%; object-fit: contain; }
    .live { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,.6); color: #fff; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .live i { color: var(--danger); font-size: 8px; margin-right: 4px; }
    .fail { color: #9fb0cb; text-align: center; } .fail i { font-size: 38px; }
  `],
})
export class StreamDialogComponent {
  ui = inject(UiService);
  private store = inject(StoreService);
  private api = inject(ApiService);
  failed = signal(false);
  private tick = signal(0);

  constructor() {
    // nouveau local ouvert => on repart d'un état propre
    effect(() => {
      this.ui.streamLocal();
      this.failed.set(false);
    });
  }

  src = computed(() => {
    const l = this.ui.streamLocal();
    return l ? `${this.api.streamUrl(l.id)}?t=${this.tick()}` : '';
  });
  level = computed(() => this.store.locals().find((x) => x.id === this.ui.streamLocal()?.id)?.alertLevel ?? 'normal');
  cls = computed(() => levelClass(this.level()));
  label = computed(() => levelLabel(this.level()));

  retry() {
    this.failed.set(false);
    this.tick.update((n) => n + 1);
  }
}
