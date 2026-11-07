import { Injectable, signal } from '@angular/core';
import { Local } from './models';

@Injectable({ providedIn: 'root' })
export class UiService {
  streamLocal = signal<Local | null>(null);
  openStream = (l: Local) => this.streamLocal.set(l);
  closeStream = () => this.streamLocal.set(null);
}
