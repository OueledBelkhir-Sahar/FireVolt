import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. On lit le jeton rangé à la connexion et on l'ajoute à la requête
    const token = localStorage.getItem('token');
    const requete = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    // 2. Si le serveur répond 401 (jeton absent, faux ou expiré), retour au login
    return next.handle(requete).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('auth/login')) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
