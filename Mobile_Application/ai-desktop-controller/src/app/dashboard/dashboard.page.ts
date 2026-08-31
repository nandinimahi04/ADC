import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

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

  // Actual PC information
  deviceName = 'Unknown Device';
  operatingSystem = 'Unknown';


  constructor(
    private desktopAgent: DesktopAgentService
  ) {}


  /**
   * This runs automatically when
   * the Dashboard page opens.
   */
  ngOnInit(): void {

    this.loadSystemInfo();

  }


  /**
   * Get actual Desktop Agent PC information.
   */
  async loadSystemInfo(): Promise<void> {

    try {

      console.log(
        'Getting desktop system information...'
      );

      const response =
        await this.desktopAgent.getSystemInfo();

      console.log(
        'System information:',
        response
      );


      const data =
        response.data as {
          deviceName?: string;
          operatingSystem?: string;
        };


      this.deviceName =
        data.deviceName ||
        'Unknown Device';

      this.operatingSystem =
        data.operatingSystem ||
        'Unknown';


    } catch (error) {

      console.error(
        'Failed to load system information:',
        error
      );

    }

  }


  /**
   * Open Google Chrome on the Desktop Agent PC.
   */
  async openChrome(): Promise<void> {

    if (this.isExecuting) {
      return;
    }

    this.isExecuting = true;

    try {

      console.log(
        'Sending Open Chrome command...'
      );

      const response =
        await this.desktopAgent.openApplication(
          'chrome'
        );

      console.log(
        'Chrome command successful:',
        response
      );

    } catch (error) {

      console.error(
        'Chrome command failed:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to send command.'
      );

    } finally {

      this.isExecuting = false;

    }

  }


  /**
   * Execute Shutdown / Lock / Sleep.
   */
  async executeSystemCommand(
    command: 'shutdown' | 'lock' | 'sleep'
  ): Promise<void> {

    if (this.isExecuting) {
      return;
    }


    let message = '';


    if (command === 'shutdown') {

      message =
        'Are you sure you want to shut down the PC?';

    }


    if (command === 'lock') {

      message =
        'Are you sure you want to lock the PC?';

    }


    if (command === 'sleep') {

      message =
        'Are you sure you want to put the PC to sleep?';

    }


    if (!confirm(message)) {
      return;
    }


    this.isExecuting = true;


    try {

      console.log(
        `Sending ${command} command...`
      );


      const response =
        await this.desktopAgent.executeSystemCommand(
          command
        );


      console.log(
        `${command} command successful:`,
        response
      );


    } catch (error) {

      console.error(
        `${command} command failed:`,
        error
      );


      alert(
        error instanceof Error
          ? error.message
          : `Failed to execute ${command}.`
      );


    } finally {

      this.isExecuting = false;

    }

  }

}