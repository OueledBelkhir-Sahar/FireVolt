import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device } from './vehicule.service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AddvehiculeService {

  constructor(private http: HttpClient) {
  }

  addveh(device: Device) {
    if (device.id) {
      return this.http.put(environment.apiURL + "devices/" + device.id, device,);
    } else {
      return this.http.post(environment.apiURL + "devices/", device,);
    }
  }

}

