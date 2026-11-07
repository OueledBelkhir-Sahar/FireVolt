import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  user = signal<User | null>(null);
  isAdmin = computed(() => !!this.user()?.administrator);

  /**  POST /api/session en x-www-form-urlencoded. */
  async login(email: string, password: string): Promise<User> {
    const body = new HttpParams().set('email', email).set('password', password);
    const u = await firstValueFrom(this.http.post<User>('/api/session', body));
    this.user.set(u);
    return u;
  }

  async restore(): Promise<boolean> {
    if (this.user()) return true;
    try {
      this.user.set(await firstValueFrom(this.http.get<User>('/api/session')));
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await firstValueFrom(this.http.delete('/api/session'));
    } finally {
      this.user.set(null);
    }
  }
}
