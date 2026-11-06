import { Injectable } from '@angular/core';
import {User} from '../models/models.model';

@Injectable({
  providedIn: 'root'
})
export class AuthentificationsService {

  private readonly USER_KEY = 'connected_user';

  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

}
