import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';

/**
 * Root application shell.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  /**
   * Sidebar collapsed state.
   */
  sidebarCollapsed = false;

  /**
   * Receives sidebar state changes.
   */
  onSidebarStateChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}