import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

@Component({ template: '<h1>Tableau de bord</h1><p class="sub">Page en construction (étape suivante).</p>' })
class DashboardPlaceholder {}

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPlaceholder },
    ],
  },
  { path: '**', redirectTo: '' },
];
