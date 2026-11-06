import { Injectable } from '@angular/core';
import { HttpHandler, HttpRequest, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptorService implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');  // Récupérer le token JWT du localStorage

    if (token && token !== 'null') {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur HTTP dans l\'intercepteur :', error);

        if (error.status === 400 || error.status === 401) {
          // Supprimer le token expiré
          localStorage.removeItem('token');
          // Rediriger vers la page de login
          this.router.navigate(['/login']);
        }

        return throwError(error);
      })
    );
  }
}


