import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';

export interface Device {
  "id"?: number;
  name: string;
  uniqueId: string;
  attributes: {
    region: string;
    speedLimit: string;

  };

}

@Injectable({
  providedIn: 'root'
})
export class VehiculeService {

  constructor(private http: HttpClient) { }
  getDevices(){
    return this.http.get<Device[]>(`${environment.apiURL}devices`,)
  }

  deleteVehicule(device: Device){
    return this.http.delete(environment.apiURL + "devices/" + device.id, );
  }
  getDeviceById(id: number): Observable<Device> {
    return this.http.get<Device>(`/api/devices/${id}`);
  }


}
