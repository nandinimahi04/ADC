import { Routes } from '@angular/router';

export const routes: Routes = [

  // ===============================
  // SPLASH
  // ===============================

  {
    path: 'splash',
    loadComponent: () =>
      import('./splash/splash.page').then(
        (m) => m.SplashPage
      )
  },


  // ===============================
  // LOGIN
  // ===============================

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.page').then(
        (m) => m.LoginPage
      )
  },


  // ===============================
  // CREATE PIN
  // ===============================

  {
    path: 'create-pin',
    loadComponent: () =>
      import('./auth/create-pin/create-pin.page').then(
        (m) => m.CreatePinPage
      )
  },


  // ===============================
  // CONFIRM PIN
  // ===============================

  {
    path: 'confirm-pin',
    loadComponent: () =>
      import('./auth/confirm-pin/confirm-pin.page').then(
        (m) => m.ConfirmPinPage
      )
  },


  // ===============================
  // PAIR DEVICE / QR SCANNER
  // ===============================

  {
    path: 'pair-device',
    loadComponent: () =>
      import('./pair-device/pair-device.page').then(
        (m) => m.PairDevicePage
      )
  },


  // ===============================
  // DASHBOARD
  // ===============================

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      )
  },


  // ===============================
  // DEFAULT ROUTE
  // ===============================

  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },


  // ===============================
  // UNKNOWN ROUTES
  // ===============================

  {
    path: '**',
    redirectTo: 'splash'
  }

];