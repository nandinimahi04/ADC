import { Injectable } from '@angular/core'; 
 
@Injectable({ 
  providedIn: 'root' 
}) 
export class ThemeService { 
 
  private readonly storageKey = 
    'desktop-agent-theme'; 
 
 
  constructor() { 
 
    this.initializeTheme(); 
 
  } 
 
 
  /** 
   * Initialize the application theme. 
   * 
   * Dark mode is the default. 
   */ 
  private initializeTheme(): void { 
 
    const savedTheme = 
      localStorage.getItem( 
        this.storageKey 
      ); 
 
 
    if (savedTheme === 'light') { 
 
      this.applyTheme('light'); 
 
    } else { 
 
      this.applyTheme('dark'); 
 
    } 
 
  } 
 
 
  /** 
   * Set application theme. 
   */ 
  setTheme( 
    theme: 'dark' | 'light' 
  ): void { 
 
    localStorage.setItem( 
      this.storageKey, 
      theme 
    ); 
 
    this.applyTheme(theme); 
 
  } 
 
 
  /** 
   * Apply theme to the document. 
   */ 
  private applyTheme( 
    theme: 'dark' | 'light' 
  ): void { 
 
    document.documentElement 
      .setAttribute( 
        'data-theme', 
        theme 
      ); 
 
    document.body.classList.toggle( 
      'light-theme', 
      theme === 'light' 
    ); 
 
    document.body.classList.toggle( 
      'dark-theme', 
      theme === 'dark' 
    ); 
 
  } 
 
 
  /** 
   * Check whether dark theme is active. 
   */ 
  isDarkTheme(): boolean { 
 
    return document.documentElement 
      .getAttribute('data-theme') !== 'light'; 
 
  } 
 
 
  /** 
   * Get current theme. 
   */ 
  getTheme(): 'dark' | 'light' { 
 
    return this.isDarkTheme() 
      ? 'dark' 
      : 'light'; 
 
  } 
 
 
  /** 
   * Toggle between dark and light themes. 
   */ 
  toggleTheme(): void { 
 
    const newTheme = 
      this.isDarkTheme() 
        ? 'light' 
        : 'dark'; 
 
 
    this.setTheme(newTheme); 
 
  } 
 
}  