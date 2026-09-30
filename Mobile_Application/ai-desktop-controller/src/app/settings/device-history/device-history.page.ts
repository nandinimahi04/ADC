import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  powerOutline,
  appsOutline,
  folderOutline,
  terminalOutline,
  cloudOfflineOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';

import {
  PairedDevicesService,
  PairedDesktop,
  DesktopHistoryItem
} from '../../services/paired-devices.service';

@Component({
  selector: 'app-device-history',
  standalone: true,
  templateUrl: './device-history.page.html',
  styleUrls: ['./device-history.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent
  ]
})
export class DeviceHistoryPage {

  device: PairedDesktop | undefined;

  items: DesktopHistoryItem[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pairedDevices: PairedDevicesService
  ) {
    addIcons({
      arrowBackOutline,
      powerOutline,
      appsOutline,
      folderOutline,
      terminalOutline,
      cloudOfflineOutline,
      refreshOutline,
      timeOutline
    });
  }

  ionViewWillEnter(): void {

    const deviceId =
      this.route.snapshot.paramMap.get('deviceId') || '';

    this.device = this.pairedDevices.get(deviceId);

    void this.load();
  }

  async load(): Promise<void> {

    this.loading = true;
    this.errorMessage = '';

    if (!this.device) {
      this.loading = false;
      this.errorMessage = 'This device is no longer paired.';
      return;
    }

    try {

      this.items = await this.pairedDevices.getHistory(this.device);

    } catch (error) {

      console.error('Failed to load history:', error);

      this.items = [];

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load command history.';

    } finally {
      this.loading = false;
    }
  }

    async onRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as unknown as { complete: () => void } | null)?.complete();
  }

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  iconFor(item: DesktopHistoryItem): string {
    switch (item.commandType) {
      case 'system':      return 'power-outline';
      case 'application': return 'apps-outline';
      case 'file':        return 'folder-outline';
      default:            return 'terminal-outline';
    }
  }

  titleFor(item: DesktopHistoryItem): string {

    // Applications are stored like "open:chrome"
    const [action, target] = item.command.split(':');

    return target
      ? `${this.capitalize(action)} ${target}`
      : this.capitalize(item.command);
  }

  isSuccess(item: DesktopHistoryItem): boolean {
    return item.status === 'success';
  }

  statusLabel(item: DesktopHistoryItem): string {
    return this.isSuccess(item) ? 'Success' : 'Failed';
  }

  trackById(_: number, item: DesktopHistoryItem): number {
    return item.id;
  }

  private capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  goBack(): void {
    this.router.navigate(['/paired-devices']);
  }
}