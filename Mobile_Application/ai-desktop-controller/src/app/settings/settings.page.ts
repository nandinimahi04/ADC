import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonFooter,
  IonModal
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  gridOutline,
  chatbubbleEllipsesOutline,
  appsOutline,
  timeOutline,
  settingsOutline,
  moonOutline,
  sunnyOutline,
  keyOutline,
  desktopOutline,
  informationCircleOutline,
  chevronForwardOutline,
  colorPaletteOutline,
  closeOutline,
  hardwareChipOutline
} from 'ionicons/icons';

import { ThemeService, ThemeMode } from '../services/theme.service';
import { PairedDevicesService } from '../services/paired-devices.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
    IonFooter,
    IonModal
  ]
})
export class SettingsPage {

  theme: ThemeMode = 'dark';
  pairedCount = 0;

  aboutOpen = false;
  appVersion = '0.0.1';

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private pairedDevices: PairedDevicesService
  ) {
    addIcons({
      gridOutline,
      chatbubbleEllipsesOutline,
      appsOutline,
      timeOutline,
      settingsOutline,
      moonOutline,
      sunnyOutline,
      keyOutline,
      desktopOutline,
      informationCircleOutline,
      chevronForwardOutline,
      colorPaletteOutline,
      closeOutline,
      hardwareChipOutline
    });

    void this.loadAppVersion();
  }

  // Runs every time the page is shown.
  ionViewWillEnter(): void {
    this.theme = this.themeService.mode;
    this.pairedCount = this.pairedDevices.list().length;
  }

  get pairedLabel(): string {
    if (this.pairedCount === 0) return 'No devices paired';
    return this.pairedCount === 1
      ? '1 device paired'
      : `${this.pairedCount} devices paired`;
  }

  setTheme(mode: ThemeMode): void {
    this.theme = mode;
    this.themeService.setMode(mode);
  }

  openChangePin(): void {
    this.router.navigate(['/change-pin']);
  }

  openPairedDevices(): void {
    this.router.navigate(['/paired-devices']);
  }

  private async loadAppVersion(): Promise<void> {

    if (!Capacitor.isNativePlatform()) return;

    try {
      const info = await App.getInfo();
      this.appVersion = info.version || this.appVersion;
    } catch {
      /* keep the default */
    }
  }

  onNavClick(
    tab: 'dashboard' | 'ai-chat' | 'control' | 'history' | 'settings'
  ): void {
    if (tab === 'settings') return;
    if (tab === 'dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (tab === 'control') {
      this.router.navigate(['/control']);
      return;
    }
    if (tab === 'ai-chat') {
      this.router.navigate(['/ai-chat']);
      return;
    }
    alert('This page is not developed yet.');
  }
}