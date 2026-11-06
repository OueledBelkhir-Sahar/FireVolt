import { Injectable } from '@angular/core';
import { HttpClient , HttpParams} from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import {Superviseur} from '../models/models.model';

@Injectable({
  providedIn: 'root'
})
export class SuperviseurService {

  constructor(private http: HttpClient) { }
  getSuperviseur( ){
    const params = new HttpParams().set('supervisor', 'true');

    return this.http.get<Superviseur[]>(`${environment.apiURL}users`, { params });
  }
  deleteSup(superviseurs: Superviseur){
    return this.http.delete(environment.apiURL + "users/" + superviseurs.id,  );
  }
}
