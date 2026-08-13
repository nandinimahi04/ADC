import { Routes } from '@angular/router';

/**
 * Application route configuration.
 */
export const routes: Routes = [

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(
          (m) => m.DashboardComponent
        ),
  },

  {
    path: 'pairing',
    loadComponent: () =>
      import('./pages/pairing/pairing.component')
        .then(
          (m) => m.PairingComponent
        ),
  },

  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/devices/devices.component')
        .then(
          (m) => m.DevicesComponent
        ),
  },

  {
    path: 'logs',
    loadComponent: () =>
      import('./pages/logs/logs.component')
        .then(
          (m) => m.LogsComponent
        ),
  },

  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component')
        .then(
          (m) => m.SettingsComponent
        ),
  },

  {
    path: '**',
    redirectTo: 'dashboard',
  },
];