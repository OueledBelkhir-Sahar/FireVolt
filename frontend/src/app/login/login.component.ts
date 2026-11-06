import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {LoginService} from '../services/login.service';
import {AuthentificationsService} from '../services/authentifications.service';
import { User } from '../models/models.model';
import {NzNotificationService} from 'ng-zorro-antd/notification';  // Assurez-vous d'importer l'interface User

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private loginService: LoginService,
              private router: Router,
              private authentificationsService: AuthentificationsService,
              private notification: NzNotificationService,
  ) {}
  username: string= '';
  password: string= '';
  errorMessage: string= '';


    onLogin() {
      console.log('Tentative de connexion avec:', this.username, this.password);
      this.loginService.login(this.username, this.password).subscribe({
        next: () => {
          console.log('Réponse serveur:');

          this.router.navigate(['/home']).then(success => {
            console.log('Navigation réussie ?', success);
            if (!success) {
              console.error('La navigation vers /home a échoué !');
            }
          }).catch(err => {
            console.error('Erreur de navigation:', err);

            localStorage.removeItem('accessToken');
            this.router.navigate(['/login']);

          });
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.errorMessage = 'Vérifier votre mot de passe ou Email';

          this.notification.create(
            'error',
            'Erreur de connexion',
            'Vérifier votre mot de passe ou Email',
            {nzDuration: 4000}


          );
        },
      });
    }
}

