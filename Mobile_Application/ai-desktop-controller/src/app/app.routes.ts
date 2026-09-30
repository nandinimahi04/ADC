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
  // CONTROL
  // ===============================

  {
    path: 'control',
    loadComponent: () =>
      import('./control/control.page').then(
        (m) => m.ControlPage
      )
  },


  // ===============================
  // AI CHAT                                  // NEW
  // ===============================

  {
    path: 'ai-chat',                          // NEW
    loadComponent: () =>
      import('./ai-chat/ai-chat.page').then(
        (m) => m.AiChatPage
      )
  },
    // ===============================
  // SETTINGS
  // ===============================

  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.page').then(
        (m) => m.SettingsPage
      )
  },

  {
    path: 'change-pin',
    loadComponent: () =>
      import('./settings/change-pin/change-pin.page').then(
        (m) => m.ChangePinPage
      )
  },

  {
    path: 'paired-devices',
    loadComponent: () =>
      import('./settings/paired-devices/paired-devices.page').then(
        (m) => m.PairedDevicesPage
      )
  },

  {
    path: 'device-history/:deviceId',
    loadComponent: () =>
      import('./settings/device-history/device-history.page').then(
        (m) => m.DeviceHistoryPage
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