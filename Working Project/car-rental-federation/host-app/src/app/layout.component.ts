import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="flex h-screen w-full bg-gray-100">
  <!-- Sidebar (Desktop) -->
  <aside class="hidden w-64 flex-col bg-white p-4 shadow-lg transition-all duration-300 md:flex">
    <div class="mb-8 flex items-center gap-3 px-2">
      <svg class="h-10 w-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 6.75h.008v.008H12v-.008Z" />
      </svg>
      <span class="text-2xl font-bold text-gray-800">Apex Rentals</span>
    </div>
    <nav class="flex-1 space-y-2">
      <!-- Navigation Links -->
      <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="bg-blue-50 text-blue-600"
        class="group flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50">
        <svg class="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ng-container [ngSwitch]="item.icon">
            <g *ngSwitchCase="'dashboard'">
              <rect width="18" height="18" x="3" y="3" rx="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" />
            </g>
            <g *ngSwitchCase="'vehicles'">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4c.6 0 1 .4 1 1h3c.6 0 1 .4 1 1s-.4 1-1 1H3" /><path d="M7 17h6" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
            </g>
            <g *ngSwitchCase="'customers'">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </g>
            <g *ngSwitchCase="'bookings'">
              <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
            </g>
            <g *ngSwitchCase="'admin'">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
            </g>
          </ng-container>
        </svg>
        <span class="font-medium">{{ item.name }}</span>
      </a>
    </nav>
    <!-- Logout Button -->
    <div class="mt-auto">
      <a (click)="logout()"
        class="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-colors duration-200 hover:bg-gray-50">
        <svg class="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span class="font-medium">Logout</span>
      </a>
    </div>
  </aside>

  <!-- Main Content Area -->
  <div class="flex flex-1 flex-col overflow-y-auto">
    <!-- Topbar (Mobile) -->
    <header class="flex h-16 items-center justify-between bg-white px-4 shadow-md md:hidden">
      <span class="text-xl font-bold text-blue-600">Apex Rentals</span>
      <button (click)="isMobileMenuOpen.set(!isMobileMenuOpen())"
        class="rounded-md p-2 text-gray-600 hover:bg-gray-100">
        <!-- Menu Icon -->
        <svg *ngIf="!isMobileMenuOpen()" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <!-- Close Icon -->
        <svg *ngIf="isMobileMenuOpen()" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </header>

    <!-- Mobile Menu -->
    <nav *ngIf="isMobileMenuOpen()" class="space-y-2 bg-white p-4 shadow-md md:hidden">
      <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="bg-blue-50 text-blue-600"
        class="group flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50"
        (click)="isMobileMenuOpen.set(false)">
        <svg class="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ng-container [ngSwitch]="item.icon">
            <g *ngSwitchCase="'dashboard'">
              <rect width="18" height="18" x="3" y="3" rx="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" />
            </g>
            <g *ngSwitchCase="'vehicles'">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4c.6 0 1 .4 1 1h3c.6 0 1 .4 1 1s-.4 1-1 1H3" /><path d="M7 17h6" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
            </g>
            <g *ngSwitchCase="'customers'">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </g>
            <g *ngSwitchCase="'bookings'">
              <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
            </g>
            <g *ngSwitchCase="'admin'">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
            </g>
          </ng-container>
        </svg>
        <span class="font-medium">{{ item.name }}</span>
      </a>
      <a (click)="logout()"
        class="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-colors duration-200 hover:bg-gray-50">
        <svg class="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span class="font-medium">Logout</span>
      </a>
    </nav>

    <!-- Router Outlet -->
    <main class="flex-1 overflow-y-auto p-4 md:p-8">
      <router-outlet />
    </main>
  </div>
</div>
  `
})
export class LayoutComponent {
  isMobileMenuOpen = signal(false);

  navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Vehicles', path: '/vehicles', icon: 'vehicles' },
    { name: 'Customers', path: '/customers', icon: 'customers' },
    { name: 'Bookings', path: '/bookings', icon: 'bookings' },
    { name: 'Admin', path: '/admin', icon: 'admin' }
  ];

  constructor(private router: Router) { }

  logout() {
    this.isMobileMenuOpen.set(false);
    this.router.navigate(['/login']);
  }
}