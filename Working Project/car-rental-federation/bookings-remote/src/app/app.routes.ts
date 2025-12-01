import { Routes } from '@angular/router';
import { BookingsComponent } from './bookings.component';

export const routes: Routes = [
    { path: '', component: BookingsComponent },
    { path: '**', redirectTo: '' }
];
