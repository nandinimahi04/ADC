import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { App, AppState } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonFooter
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  closeCircleOutline,
  notificationsOutline,
  gridOutline,
  chatbubbleEllipsesOutline,
  appsOutline,
  timeOutline,
  settingsOutline,
  hardwareChipOutline,
  radioOutline,
  laptopOutline,
  checkmarkCircleOutline,
  flashOutline,
  powerOutline,
  lockClosedOutline,
  moonOutline,
  refreshOutline
} from 'ionicons/icons';

import { DesktopAgentService } from '../services/desktop-agent.service';

interface SystemInfoData {
  deviceName?: string;
  operatingSystem?: string;
  hasBattery?: boolean;
  batteryPercentage?: number | null;
  isCharging?: boolean | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter
  ]
})
export class DashboardPage implements OnInit, OnDestroy {

  isExecuting = false;
  deviceName = 'Unknown Device';
  operatingSystem = 'Unknown';

  hasBattery = false;
  batteryPercentage: number | null = null;
  isCharging: boolean | null = null;

  batteryLoaded = false;

  private readonly REFRESH_INTERVAL_MS = 10000;
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private appStateListener: PluginListenerHandle | null = null;

  constructor(
    private desktopAgent: DesktopAgentService,
    private router: Router
  ) {
    addIcons({
      closeCircleOutline,
      notificationsOutline,
      gridOutline,
      chatbubbleEllipsesOutline,
      appsOutline,
      timeOutline,
      settingsOutline,
      hardwareChipOutline,
      radioOutline,
      laptopOutline,
      checkmarkCircleOutline,
      flashOutline,
      powerOutline,
      lockClosedOutline,
      moonOutline,
      refreshOutline
    });
  }

  ngOnInit(): void {
    this.loadSystemInfo();
    this.startAutoRefresh();
    this.listenForAppStateChanges();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshHandle = setInterval(() => {
      void this.loadSystemInfo();
    }, this.REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshHandle !== null) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  private listenForAppStateChanges(): void {
    App.addListener('appStateChange', (state: AppState) => {
        if (state.isActive) {
          void this.loadSystemInfo();
          this.startAutoRefresh();
        } else {
          this.stopAutoRefresh();
        }
      }
    ).then(handle => {

      this.appStateListener = handle;
    });
  }

  async loadSystemInfo(): Promise<void> {
    try {

      /*
       * First check whether the Desktop Agent
       * still considers this device paired.
       */
      const pairingStatus =
        await this.desktopAgent.getPairingStatus();

      /*
       * A successful response with paired=false
       * or disconnected means the Desktop Agent
       * explicitly disconnected this mobile device.
       */
      if (
        !pairingStatus.success ||
        !pairingStatus.data?.paired ||
        pairingStatus.data.status === 'disconnected'
      ) {

        console.warn(
          'Desktop Agent disconnected the mobile device.'
        );

        await this.handleDisconnected();

        return;
      }

      /*
       * Pairing is still valid.
       * Continue loading system information.
       */
      const response =
        await this.desktopAgent.getSystemInfo();

      const data = response.data as SystemInfoData;

      this.deviceName = data?.deviceName || 'Unknown Device';
      this.operatingSystem = data?.operatingSystem || 'Unknown';

      this.hasBattery =
        !!data?.hasBattery;

      this.batteryPercentage =
        typeof data?.batteryPercentage === 'number'
          ? data.batteryPercentage
          : null;

      this.isCharging =
        data?.isCharging ?? null;

      this.batteryLoaded = true;

    } catch (error) {

      console.error(
        'Failed to load system information:',
        error
      );

      /*
       * Do NOT immediately disconnect on a temporary
       * network failure.
       *
       * getPairingStatus() already handles HTTP 401
       * by clearing local authentication and returning
       * paired=false.
       *
       * Therefore this catch is primarily for an
       * unreachable Desktop Agent.
       */
    }
  }

  /**
   * Handles an explicit Desktop Agent disconnect.
   */
  private async handleDisconnected(): Promise<void> {

    this.stopAutoRefresh();

    await this.desktopAgent.clearLocalPairing();

    alert(
      'Disconnected from Desktop Agent. Please pair again.'
    );

    await this.router.navigate([
      '/pair-device'
    ]);
  }

  get batteryDotClass(): string {
    if (this.isCharging) return 'charging';
    if (this.batteryPercentage !== null && this.batteryPercentage <= 20) return 'low';
    return 'normal';
  }

 async openChrome(): Promise<void> {
    if (this.isExecuting) return;
    this.isExecuting = true;
    try {
      const response = await this.desktopAgent.openApplication('chrome');
      console.log('Chrome command successful:', response);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send command.');
    } finally {
      this.isExecuting = false;
    }
  }

  async executeSystemCommand(command: 'shutdown' | 'lock' | 'sleep' | 'restart'): Promise<void> {
    if (this.isExecuting) return;

    let message = '';
    if (command === 'shutdown') message = 'Are you sure you want to shut down the PC?';
    if (command === 'lock') message = 'Are you sure you want to lock the PC?';
    if (command === 'sleep') message = 'Are you sure you want to put the PC to sleep?';
    if (command === 'restart') message = 'Are you sure you want to restart the PC?';

    if (!confirm(message)) return;

    this.isExecuting = true;
    try {
      const response = await this.desktopAgent.executeSystemCommand(command);
      console.log(`${command} command successful:`, response);
    } catch (error) {
      alert(error instanceof Error ? error.message : `Failed to execute ${command}.`);
    } finally {
      this.isExecuting = false;
    }
  }

  async disconnect(): Promise<void> {

    if (this.isExecuting) return;

    if (!confirm('Disconnect from this PC? You will need to scan a QR code to connect again.')) {
      return;
    }

    this.isExecuting = true;

    try {

      console.log('Disconnecting from Desktop Agent...');

      this.stopAutoRefresh();

      await this.desktopAgent.disconnect();

      console.log('Disconnected successfully.');

      this.router.navigate(['/pair-device']);

    } catch (error) {

      alert(error instanceof Error ? error.message : 'Failed to disconnect.');
      await this.router.navigate([
        '/pair-device'
      ]);
      
    } finally {

      this.isExecuting = false;

    }

  }

  onNavClick(tab: 'dashboard' | 'ai-chat' | 'control' | 'history' | 'settings'): void {
    if (tab === 'dashboard') return;
    if (tab === 'control') {
      this.router.navigate(['/control']);
      return;
    }
    alert('This page is not developed yet.');
  }

}