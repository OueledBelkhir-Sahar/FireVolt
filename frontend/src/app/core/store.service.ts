import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { FvEvent, Local } from './models';

/**
 * Données temps réel partagées : liste des locaux + dernières alertes.
 *  /api/socket (messages { devices | events | deletedDevices }).
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  private api = inject(ApiService);

  locals = signal<Local[]>([]);
  events = signal<FvEvent[]>([]);
  toasts = signal<FvEvent[]>([]);
  connected = signal(false);

  private ws?: WebSocket;
  private active = false;

  async start() {
    if (this.active) return;
    this.active = true;
    this.locals.set(await this.api.devices());
    this.events.set(await this.api.events({ limit: 30 }));
    this.connect();
  }

  stop() {
    this.active = false;
    this.ws?.close();
    this.locals.set([]);
    this.events.set([]);
    this.toasts.set([]);
    this.connected.set(false);
  }

  upsert(l: Local) {
    this.locals.update((list) => (list.some((x) => x.id === l.id) ? list.map((x) => (x.id === l.id ? l : x)) : [...list, l]));
  }

  remove(id: number) {
    this.locals.update((list) => list.filter((x) => x.id !== id));
  }

  dismissToast(id: number) {
    this.toasts.update((t) => t.filter((e) => e.id !== id));
  }

  private connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}/api/socket`);
    this.ws.onopen = () => this.connected.set(true);
    this.ws.onclose = () => {
      this.connected.set(false);
      if (this.active) setTimeout(() => this.active && this.connect(), 3000);
    };
    this.ws.onmessage = (m) => this.handle(JSON.parse(m.data));
  }

  private handle(msg: { devices?: Local[]; events?: FvEvent[]; deletedDevices?: number[] }) {
    msg.devices?.forEach((d) => this.upsert(d));
    msg.deletedDevices?.forEach((id) => this.remove(id));
    msg.events?.forEach((e) => {
      this.events.update((list) => [e, ...list].slice(0, 50));
      if (e.level === 'alert') {
        this.toasts.update((t) => [e, ...t].slice(0, 4));
        setTimeout(() => this.dismissToast(e.id), 12000);
      }
    });
  }
}
