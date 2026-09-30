import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  desktopOutline,
  timeOutline,
  closeCircleOutline,
  qrCodeOutline,
  swapHorizontalOutline
} from 'ionicons/icons';

import {
  PairedDevicesService,
  PairedDesktop,
  DeviceConnectionState
} from '../../services/paired-devices.service';

interface DeviceRow {
  device: PairedDesktop;
  isActive: boolean;
  state: DeviceConnectionState | 'checking';
}

@Component({
  selector: 'app-paired-devices',
  standalone: true,
  templateUrl: './paired-devices.page.html',
  styleUrls: ['./paired-devices.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon
  ]
})
export class PairedDevicesPage {

  rows: DeviceRow[] = [];
  busyId: string | null = null;

  constructor(
    private router: Router,
    private pairedDevices: PairedDevicesService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      desktopOutline,
      timeOutline,
      closeCircleOutline,
      qrCodeOutline,
      swapHorizontalOutline
    });
  }

  ionViewWillEnter(): void {
    this.loadDevices();
  }

  get countLabel(): string {
    const n = this.rows.length;
    if (n === 0) return 'No devices paired';
    return n === 1 ? '1 device paired' : `${n} devices paired`;
  }

  // ============================================================
  // LIST
  // ============================================================

  private loadDevices(): void {

    const activeId = this.pairedDevices.getActiveId();

    // Newest first
    this.rows = this.pairedDevices
      .list()
      .slice()
      .reverse()
      .map(device => ({
        device,
        isActive: device.deviceId === activeId,
        state: 'checking' as const
      }));

    // Check every desktop in the background.
    for (const row of this.rows) {
      void this.refreshState(row.device.deviceId);
    }
  }

  private async refreshState(deviceId: string): Promise<void> {

    const row = this.rows.find(r => r.device.deviceId === deviceId);
    if (!row) return;

    const state = await this.pairedDevices.checkState(row.device);

    // The row may have been removed while the check was running.
    const current = this.rows.find(r => r.device.deviceId === deviceId);
    if (current) current.state = state;
  }

  stateLabel(row: DeviceRow): string {
    switch (row.state) {
      case 'checking': return 'Checking...';
      case 'online':   return 'Online';
      case 'offline':  return 'Offline';
      default:         return 'Not paired anymore';
    }
  }

  stateClass(row: DeviceRow): string {
    switch (row.state) {
      case 'online':   return 'success';
      case 'unpaired': return 'danger';
      default:         return '';
    }
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  viewHistory(row: DeviceRow): void {
    this.router.navigate(['/device-history', row.device.deviceId]);
  }

  makeActive(row: DeviceRow): void {
    this.pairedDevices.setActive(row.device);
    this.loadDevices();
    void this.toast(`Now controlling ${row.device.deviceName}.`);
  }

  async confirmDisconnect(row: DeviceRow): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Disconnect device?',
      message:
        `Disconnect from ${row.device.deviceName}? ` +
        'You will need to scan its QR code to connect again.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Disconnect',
          role: 'destructive',
          handler: () => { void this.disconnect(row); }
        }
      ]
    });

    await alert.present();
  }

  private async disconnect(row: DeviceRow): Promise<void> {

    if (this.busyId) return;

    this.busyId = row.device.deviceId;

    try {

      const result = await this.pairedDevices.disconnect(row.device);

      this.loadDevices();

      await this.toast(
        result.remoteOk
          ? `Disconnected from ${row.device.deviceName}.`
          : `Removed ${row.device.deviceName} from this phone. ` +
            'The desktop could not be reached to unpair.'
      );

      // Nothing left to control - go pair a new desktop.
      if (result.wasActive && result.remaining === 0) {
        await this.router.navigate(['/pair-device']);
      }

    } finally {
      this.busyId = null;
    }
  }

  pairNew(): void {
    this.router.navigate(['/pair-device']);
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}