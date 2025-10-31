import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './pages/layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { VehicleComponent } from './pages/vehicle/vehicle';
import { CustomerComponent } from './pages/customer/customer';
import { BookingComponent } from './pages/booking/booking';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'vehicles', component: VehicleComponent }, // Renamed from 'vehicle' for clarity
      { path: 'customers', component: CustomerComponent },
      { path: 'bookings', component: BookingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // Default route within layout
    ]
  },
  // Add a fallback route for any unknown paths
  { path: '**', redirectTo: 'login' }
];
