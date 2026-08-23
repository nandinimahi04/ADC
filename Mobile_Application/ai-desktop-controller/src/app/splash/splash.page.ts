import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { desktopOutline } from 'ionicons/icons';

import { SQLiteService } from '../services/sqlite.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [
    IonContent,
    IonIcon
  ],
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss']
})
export class SplashPage implements OnInit {

  constructor(
    private router: Router,
    private sqliteService: SQLiteService
  ) {

    addIcons({
      desktopOutline
    });

  }

  async ngOnInit(): Promise<void> {

    // Initialize SQLite first
    try {

      await this.sqliteService.initializeDatabase();

      console.log('SQLite initialized from Splash.');

    } catch (error) {

      console.error(
        'Failed to initialize SQLite:',
        error
      );

      return;
    }

    // Give splash screen time to display
    setTimeout(() => {

      this.checkApplicationState();

    }, 2500);

  }

  private async checkApplicationState(): Promise<void> {

    try {

      const hasPin =
        await this.sqliteService.hasPin();

      if (hasPin) {

        // Existing user
        this.router.navigate(['/login']);

      } else {

        // New user
        this.router.navigate(['/create-pin']);

      }

    } catch (error) {

      console.error(
        'Failed to check application state:',
        error
      );

      this.router.navigate(['/create-pin']);

    }

  }

}