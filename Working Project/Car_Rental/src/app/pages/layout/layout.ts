import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SafeHtmlPipe } from '../../safe-html-pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SafeHtmlPipe, // Add the pipe here
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  isMobileMenuOpen = signal(false);

  // Define navigation items with Lucide icon SVG content
  navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '<rect width="18" height="18" x="3" y="3" rx="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" />',
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v4c.6 0 1 .4 1 1h3c.6 0 1 .4 1 1s-.4 1-1 1H3" /><path d="M7 17h6" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />',
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />',
    },
  ];

  constructor(private router: Router) { }

  logout() {
    // Perform any logout logic here (e.g., clear session)
    this.isMobileMenuOpen.set(false);
    this.router.navigate(['/login']);
  }
}
