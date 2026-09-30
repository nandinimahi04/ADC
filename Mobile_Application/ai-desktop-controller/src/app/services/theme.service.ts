import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'app_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private _mode: ThemeMode = 'dark';

  // Starts true because the first screen is always the splash page.
  private forceDark = true;

  /** The theme the user picked (not affected by forceDark). */
  get mode(): ThemeMode {
    return this._mode;
  }

  /** Call once at app start. */
  init(): void {
    this._mode = this.readSavedMode();
    this.apply();
  }

  setMode(mode: ThemeMode): void {
    this._mode = mode;

    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* storage unavailable - theme still applies for this session */
    }

    this.apply();
  }

  setForceDark(force: boolean): void {
    if (this.forceDark === force) return;
    this.forceDark = force;
    this.apply();
  }

  private readSavedMode(): ThemeMode {
    try {
      return localStorage.getItem(THEME_KEY) === 'light'
        ? 'light'
        : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(): void {

    const effective: ThemeMode =
      this.forceDark ? 'dark' : this._mode;

    const root = document.documentElement;

    root.classList.toggle('ion-palette-dark', effective === 'dark');
    root.classList.toggle('adc-light', effective === 'light');

    root.style.colorScheme = effective;

    void this.updateStatusBar(effective);
  }

  private async updateStatusBar(theme: ThemeMode): Promise<void> {

    if (!Capacitor.isNativePlatform()) return;

    try {
      await StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light
      });
    } catch (error) {
      console.warn('Unable to update status bar style:', error);
    }
  }
}