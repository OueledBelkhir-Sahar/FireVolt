import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FvEvent, Local, Stats, User } from './models';

/**  /users, /devices, /events ... */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // superviseurs (admin)
  users = () => firstValueFrom(this.http.get<User[]>('/api/users'));
  createUser = (u: Partial<User>) => firstValueFrom(this.http.post<User>('/api/users', u));
  updateUser = (u: Partial<User>) => firstValueFrom(this.http.put<User>(`/api/users/${u.id}`, u));
  deleteUser = (id: number) => firstValueFrom(this.http.delete<void>(`/api/users/${id}`));

  // locaux électriques
  devices = () => firstValueFrom(this.http.get<Local[]>('/api/devices'));
  createDevice = (d: Partial<Local>) => firstValueFrom(this.http.post<Local>('/api/devices', d));
  updateDevice = (d: Partial<Local>) => firstValueFrom(this.http.put<Local>(`/api/devices/${d.id}`, d));
  deleteDevice = (id: number) => firstValueFrom(this.http.delete<void>(`/api/devices/${id}`));

  // historique + stats
  events = (opts: { deviceId?: number; limit?: number } = {}) => {
    let params = new HttpParams().set('limit', opts.limit ?? 200);
    if (opts.deviceId) params = params.set('deviceId', opts.deviceId);
    return firstValueFrom(this.http.get<FvEvent[]>('/api/events', { params }));
  };
  stats = () => firstValueFrom(this.http.get<Stats>('/api/stats'));

  streamUrl = (id: number) => `/api/devices/${id}/stream`;
}
