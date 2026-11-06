import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AssocierService {

  constructor(private http: HttpClient) { }
  associerConducteur(data: { userId: number, deviceId: number }) {
    return this.http.post(`${environment.apiURL}permissions`, data);
  }
}
