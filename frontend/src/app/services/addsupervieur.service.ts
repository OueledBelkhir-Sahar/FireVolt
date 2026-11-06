import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import {Superviseur} from '../models/models.model';

@Injectable({
  providedIn: 'root'
})
export class AddsupervieurService {


  constructor( private http: HttpClient) { }
  addSuperviseur( superviseur: Superviseur){

    if (superviseur.id) {
        return this.http.put(environment.apiURL + "users/" + superviseur.id, superviseur, );
      } else {
        return this.http.post(environment.apiURL + "users/" , superviseur,);
      }

    }
}
