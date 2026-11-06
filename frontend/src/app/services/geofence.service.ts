import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {

  constructor(private http: HttpClient) { }
  deleteGeofence(id: number) {
    return this.http.delete(`/api/geofences/${id}`);
  }
}
