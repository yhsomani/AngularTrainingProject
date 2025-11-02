// Car_Rental_App/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './pages/layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { VehicleComponent } from './pages/vehicle/vehicle';
import { CustomerComponent } from './pages/customer/customer';
import { BookingComponent } from './pages/booking/booking';
import { CustomerRegisterComponent } from './pages/customer-register/customer-register';
import { ProfileComponent } from './pages/profile/profile'; // NEW IMPORT (FEATURE #4)

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register-customer', component: CustomerRegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'vehicles', component: VehicleComponent },
      { path: 'customers', component: CustomerComponent },
      { path: 'bookings', component: BookingComponent },
      { path: 'profile', component: ProfileComponent }, // NEW ROUTE (FEATURE #4)
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // Default route within layout
    ]
  },
  // Add a fallback route for any unknown paths
  { path: '**', redirectTo: 'login' }
];