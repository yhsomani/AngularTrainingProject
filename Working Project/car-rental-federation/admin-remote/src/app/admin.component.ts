import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarsManagementComponent } from './components/cars-management/cars-management.component';
import { UsersManagementComponent } from './components/users-management/users-management.component';
import { BookingsManagementComponent } from './components/bookings-management/bookings-management.component';

type AdminTab = 'dashboard' | 'cars' | 'users' | 'bookings';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, CarsManagementComponent, UsersManagementComponent, BookingsManagementComponent],
    templateUrl: './admin.component.html'
})
export class AdminComponent {
    activeTab = signal<AdminTab>('dashboard');

    tabs: { id: AdminTab; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
        { id: 'cars', label: 'Cars', icon: 'car' },
        { id: 'users', label: 'System Users', icon: 'users' },
        { id: 'bookings', label: 'Bookings', icon: 'calendar' }
    ];

    setActiveTab(tab: AdminTab) {
        this.activeTab.set(tab);
    }
}
