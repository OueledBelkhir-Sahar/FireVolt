import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'fv-login',
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <section class="hero">
        <div class="logo"><i class="fa-solid fa-bolt"></i></div>
        <h1>Fire<span>Volt</span></h1>
        <p>Surveillance intelligente et détection précoce d'incendie dans les locaux électriques.</p>
        <ul>
          <li><i class="fa-solid fa-fire"></i> Feu</li>
          <li><i class="fa-solid fa-smog"></i> Fumée</li>
          <li><i class="fa-solid fa-bolt"></i> Étincelles</li>
        </ul>
      </section>

      <section class="panel">
        <form (ngSubmit)="submit()" class="box">
          <h2>Connexion</h2>
          <p class="sub">Accédez à votre espace de supervision.</p>

          <label class="f" for="email">E-mail</label>
          <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="username" />

          <label class="f" for="pw" style="margin-top:14px">Mot de passe</label>
          <input id="pw" class="input" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />

          @if (error()) { <div class="err">{{ error() }}</div> }

          <button class="btn primary" style="width:100%;justify-content:center;margin-top:20px" [disabled]="loading()">
            {{ loading() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .wrap { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
    .hero { background: radial-gradient(circle at 20% 20%, #17407f, var(--navy) 60%); color: #fff; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
    .logo { width: 64px; height: 64px; border-radius: 18px; background: var(--orange); display: grid; place-items: center; font-size: 30px; box-shadow: 0 10px 30px rgba(255,106,26,.5); }
    h1 { font-size: 46px; margin: 22px 0 8px; } h1 span { color: var(--orange); }
    .hero p { color: #b6c4dc; font-size: 17px; max-width: 420px; line-height: 1.5; }
    ul { list-style: none; display: flex; gap: 12px; padding: 0; margin-top: 28px; }
    li { background: rgba(255,255,255,.09); padding: 9px 16px; border-radius: 99px; font-weight: 600; } li i { color: var(--orange); margin-right: 6px; }
    .panel { display: grid; place-items: center; padding: 24px; }
    .box { width: min(400px, 100%); }
    @media (max-width: 820px) { .wrap { grid-template-columns: 1fr; } .hero { padding: 32px; } }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e?.status === 401 ? 'E-mail ou mot de passe incorrect.' : 'Serveur injoignable.');
    } finally {
      this.loading.set(false);
    }
  }
}
