import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent) },
      {
        path: 'supervisors',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/supervisors.component').then((m) => m.SupervisorsComponent),
      },
      { path: 'locals', loadComponent: () => import('./pages/locals.component').then((m) => m.LocalsComponent) },
      { path: 'locals/:id/history', loadComponent: () => import('./pages/history.component').then((m) => m.HistoryComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
