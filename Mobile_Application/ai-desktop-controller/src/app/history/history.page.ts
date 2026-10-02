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
  IonFooter,
  IonRefresher,
  IonRefresherContent,
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
  trashOutline,
  closeOutline,
  powerOutline,
  refreshOutline,
  lockClosedOutline,
  moonOutline,
  terminalOutline,
  timerOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import {
  HistoryService,
  HistoryEntry
} from '../services/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter,
    IonRefresher,
    IonRefresherContent
  ]
})
export class HistoryPage {

  items: HistoryEntry[] = [];
  loading = true;

  /** Current auto-delete setting (changed in Settings). */
  retentionText = '7 days';

  constructor(
    private history: HistoryService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      gridOutline,
      chatbubbleEllipsesOutline,
      appsOutline,
      timeOutline,
      settingsOutline,
      trashOutline,
      closeOutline,
      powerOutline,
      refreshOutline,
      lockClosedOutline,
      moonOutline,
      terminalOutline,
      timerOutline,
      chevronForwardOutline
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.retentionText = this.history.retentionLabel();
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      await this.history.purgeExpired();
      this.items = await this.history.all();
    } catch (error) {
      console.error('Failed to load history:', error);
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.load();
    (event.target as unknown as { complete: () => void } | null)?.complete();
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteItem(item: HistoryEntry): Promise<void> {
    await this.history.delete(item.id);
    this.items = this.items.filter(i => i.id !== item.id);
  }

  async confirmClearAll(): Promise<void> {

    if (this.items.length === 0) return;

    const alert = await this.alertController.create({
      header: 'Clear history?',
      message: 'This deletes all history stored on this phone. It does not affect the desktop.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear all',
          role: 'destructive',
          handler: async () => {
            await this.history.clearAll();
            this.items = [];
            void this.toast('History cleared.');
          }
        }
      ]
    });

    await alert.present();
  }

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  iconFor(item: HistoryEntry): string {
    return this.history.iconFor(item);
  }

  titleFor(item: HistoryEntry): string {
    return this.history.titleFor(item);
  }

  isSuccess(item: HistoryEntry): boolean {
    return item.status === 'success';
  }

  trackById(_: number, item: HistoryEntry): number {
    return item.id;
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await t.present();
  }

  // ============================================================
  // BOTTOM NAV
  // ============================================================

  onNavClick(tab: 'dashboard' | 'ai-chat' | 'control' | 'history' | 'settings'): void {
    if (tab === 'history') return;
    this.router.navigate(['/' + tab]);
  }
}