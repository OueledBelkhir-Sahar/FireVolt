import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment.development';

export interface Geofence {
  name: string;
  area:string;
  description: string;
  calendarId: 0

}
@Injectable({
  providedIn: 'root'
})
export class GeofencesService {

  constructor( private http: HttpClient) { }

  addGeofence( geofence: Geofence){
    return this.http.post(environment.apiURL + "geofences", geofence );


  }
}
