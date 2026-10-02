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
  IonModal,
  AlertController,
  ToastController
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
  hardwareChipOutline,
  timerOutline,
  trashOutline,
  checkmarkOutline
} from 'ionicons/icons';

import { ThemeService, ThemeMode } from '../services/theme.service';
import { PairedDevicesService } from '../services/paired-devices.service';
import {
  HistoryService,
  RETENTION_OPTIONS
} from '../services/history.service';

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

  // History settings
  retentionOpen = false;
  retentionDays = 7;
  readonly retentionOptions = RETENTION_OPTIONS;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private pairedDevices: PairedDevicesService,
    private history: HistoryService,
    private alertController: AlertController,
    private toastController: ToastController
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
      hardwareChipOutline,
      timerOutline,
      trashOutline,
      checkmarkOutline
    });

    void this.loadAppVersion();
  }

  // Runs every time the page is shown.
  ionViewWillEnter(): void {
    this.theme = this.themeService.mode;
    this.pairedCount = this.pairedDevices.list().length;
    this.retentionDays = this.history.getRetentionDays();
  }

  get pairedLabel(): string {
    if (this.pairedCount === 0) return 'No devices paired';
    return this.pairedCount === 1
      ? '1 device paired'
      : `${this.pairedCount} devices paired`;
  }

  get retentionLabel(): string {
    return this.history.retentionLabel(this.retentionDays);
  }

  get retentionSubtitle(): string {
    return this.retentionDays === 0
      ? 'History is kept forever'
      : `Older than ${this.retentionLabel} is deleted`;
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

  // ============================================================
  // HISTORY SETTINGS
  // ============================================================

  async selectRetention(days: number): Promise<void> {

    this.retentionDays = days;
    this.retentionOpen = false;

    await this.history.setRetentionDays(days);

    void this.toast(
      days === 0
        ? 'History will be kept forever.'
        : `History older than ${this.history.retentionLabel(days)} will be deleted automatically.`
    );
  }

  async confirmClearHistory(): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Clear all history?',
      message: 'This deletes all history stored on this phone. It does not affect the desktop.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear all',
          role: 'destructive',
          handler: async () => {
            await this.history.clearAll();
            void this.toast('History cleared.');
          }
        }
      ]
    });

    await alert.present();
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom'
    });
    await t.present();
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
    if (tab === 'history') {
      this.router.navigate(['/history']);
      return;
    }
  }
}