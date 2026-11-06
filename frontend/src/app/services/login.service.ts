import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../environments/environment.development';
import {AuthentificationsService} from './authentifications.service';
import {User} from '../models/models.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

   constructor(private http: HttpClient,
               private authentificationsService: AuthentificationsService,) { }

  // Connexion
  login(email: string, password: string): Observable<any> {
    // Créer l'objet HttpParams pour envoyer les données dans le format 'x-www-form-urlencoded'
    const body = new HttpParams()
      .set('username', email)
      .set('password', password);

    return this.http.post<User>(environment.apiURL + 'auth/login' ,body.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),

    }).pipe( //enchaîner des opérateurs
      tap((reponse: any) => { //tap: permet de stocker l'utilisateur
        localStorage.setItem('token', reponse.access_token);

        this.authentificationsService.setUser({
          id: reponse.id,
          name: reponse.nom,
          email: email,
          role: reponse.role,
          region: reponse.region
        } as any);
      })
    );
  }
}
