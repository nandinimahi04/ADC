import {
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  LucideAngularModule,
  LayoutDashboard,
  QrCode,
  Monitor,
  FileText,
  Settings,
  ChevronLeft,
  MonitorSmartphone,
} from 'lucide-angular';

import { NavigationItem } from '../../../core/models/navigation.model';

/**
 * Application sidebar.
 *
 * Handles:
 * - Navigation
 * - Branding
 * - Collapse/expand
 * - Online indicator
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {

  /**
   * Sidebar state.
   */
  isCollapsed = false;

  /**
   * Emits sidebar state changes.
   */
  @Output()
  collapsedChange =
    new EventEmitter<boolean>();


  /**
   * Available navigation items.
   */
  readonly navigationItems: NavigationItem[] = [

    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: LayoutDashboard,
      tooltip: 'Dashboard',
    },

    {
      label: 'QR Pairing',
      route: '/pairing',
      icon: QrCode,
      tooltip: 'QR Device Pairing',
    },

    {
      label: 'Devices',
      route: '/devices',
      icon: Monitor,
      tooltip: 'Connected Devices',
    },

    {
      label: 'Logs',
      route: '/logs',
      icon: FileText,
      tooltip: 'Command Logs',
    },

    {
      label: 'Settings',
      route: '/settings',
      icon: Settings,
      tooltip: 'Application Settings',
    },

  ];


  /**
   * Sidebar icons.
   */
  readonly icons = {
    LayoutDashboard,
    QrCode,
    Monitor,
    FileText,
    Settings,
    ChevronLeft,
    MonitorSmartphone,
  };


  /**
   * Toggle sidebar.
   */
  toggleSidebar(): void {

    this.isCollapsed =
      !this.isCollapsed;

    this.collapsedChange.emit(
      this.isCollapsed
    );
  }

}