import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Driver} from '../models/models.model';
import { environment } from '../../environments/environment.development';
@Injectable({
  providedIn: 'root'
})
export class AddconducteurService {
  constructor( private http: HttpClient) { }
  addConducteur( driver: Driver){

    if (driver.id) {
      return this.http.put(environment.apiURL + "users"+ "/" + driver.id, driver, );
    } else {
      return this.http.post(environment.apiURL + "users", driver, );
    }
  }
}
