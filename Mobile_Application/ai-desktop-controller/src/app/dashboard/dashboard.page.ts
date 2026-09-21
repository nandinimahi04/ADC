import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { closeCircleOutline, notificationsOutline } from 'ionicons/icons';

import { DesktopAgentService } from '../services/desktop-agent.service';

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
    IonIcon
  ]
})
export class DashboardPage implements OnInit {

  isExecuting = false;
  deviceName = 'Unknown Device';
  operatingSystem = 'Unknown';

  constructor(
    private desktopAgent: DesktopAgentService,
    private router: Router
  ) {
    addIcons({
      closeCircleOutline,
      notificationsOutline
    });
  }

  ngOnInit(): void {
    this.loadSystemInfo();
  }

  async loadSystemInfo(): Promise<void> {
    try {
      const response = await this.desktopAgent.getSystemInfo();
      const data = response.data as { deviceName?: string; operatingSystem?: string; };
      this.deviceName = data.deviceName || 'Unknown Device';
      this.operatingSystem = data.operatingSystem || 'Unknown';
    } catch (error) {
      console.error('Failed to load system information:', error);
    }
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

  async executeSystemCommand(command: 'shutdown' | 'lock' | 'sleep'): Promise<void> {
    if (this.isExecuting) return;

    let message = '';
    if (command === 'shutdown') message = 'Are you sure you want to shut down the PC?';
    if (command === 'lock') message = 'Are you sure you want to lock the PC?';
    if (command === 'sleep') message = 'Are you sure you want to put the PC to sleep?';

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

  /**
   * Disconnect from the currently paired PC and
   * return to the QR pairing screen.
   */
  async disconnect(): Promise<void> {

    if (this.isExecuting) return;

    if (!confirm('Disconnect from this PC? You will need to scan a QR code to connect again.')) {
      return;
    }

    this.isExecuting = true;

    try {

      console.log('Disconnecting from Desktop Agent...');

      await this.desktopAgent.disconnect();

      console.log('Disconnected successfully.');

      this.router.navigate(['/pair-device']);

    } catch (error) {

      alert(error instanceof Error ? error.message : 'Failed to disconnect.');

    } finally {

      this.isExecuting = false;

    }

  }

}