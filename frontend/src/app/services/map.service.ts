import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor(private http: HttpClient) { }

  getRouteReport(deviceId: number, from: string, to: string) {
    return this.http.get<any[]>(`${environment.apiURL}reports/route?deviceId=${deviceId}&from=${from}&to=${to}`);
  }

}

