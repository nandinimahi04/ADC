import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  gridOutline,
  chatbubbleEllipsesOutline,
  appsOutline,
  timeOutline,
  settingsOutline,
  hardwareChipOutline,
  radioOutline,
  powerOutline,
  lockClosedOutline,
  moonOutline,
  refreshOutline,
  globeOutline,
  documentTextOutline,
  codeSlashOutline
} from 'ionicons/icons';

import { DesktopAgentService } from '../services/desktop-agent.service';

@Component({
  selector: 'app-control',
  templateUrl: './control.page.html',
  styleUrls: ['./control.page.scss'],
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
export class ControlPage {

  isExecuting = false;
  activeApp: 'chrome' | 'notepad' | 'vscode' | null = null;

  constructor(
    private desktopAgent: DesktopAgentService,
    private router: Router
  ) {
    addIcons({
      gridOutline,
      chatbubbleEllipsesOutline,
      appsOutline,
      timeOutline,
      settingsOutline,
      hardwareChipOutline,
      radioOutline,
      powerOutline,
      lockClosedOutline,
      moonOutline,
      refreshOutline,
      globeOutline,
      documentTextOutline,
      codeSlashOutline
    });
  }

  async openChrome(): Promise<void> {
    await this.openDesktopApp('chrome', 'Chrome');
  }

  async openNotepad(): Promise<void> {
    await this.openDesktopApp('notepad', 'Notepad');
  }

  async openVSCode(): Promise<void> {
    await this.openDesktopApp('vscode', 'VS Code');
  }

  private async openDesktopApp(
    application: 'chrome' | 'notepad' | 'vscode',
    label: string
  ): Promise<void> {
    if (this.isExecuting) return;
    this.isExecuting = true;
    this.activeApp = application;
    try {
      const response = await this.desktopAgent.openApplication(application);
      console.log(`${label} command successful:`, response);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send command.');
    } finally {
      this.isExecuting = false;
      this.activeApp = null;
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

    onNavClick(tab: 'dashboard' | 'ai-chat' | 'control' | 'history' | 'settings'): void {
    if (tab === 'control') return;
    if (tab === 'dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (tab === 'ai-chat') {
      this.router.navigate(['/ai-chat']);
      return;
    }
    alert('This page is not developed yet.');
  }

}