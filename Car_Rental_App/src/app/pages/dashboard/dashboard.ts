// Git Upload Project/Car_Rental_App/src/app/pages/dashboard/dashboard.ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { CarRentalService } from '../../services/car-rental.service';
import { Booking, Customer, DashboardData } from '../../model/api.types';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  carRentalService = inject(CarRentalService);

  // --- State Signals ---
  dashboardData = signal<DashboardData | null>(null);
  allBookings = signal<Booking[]>([]);
  allCustomers = signal<Customer[]>([]);
  recentBookings = signal<Booking[]>([]);
  topCustomers = signal<Customer[]>([]);

  isLoading = signal(true);
  errorMessage = signal('');
  notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  today: Date = new Date();

  ngOnInit() {
    this.loadAllDashboardData();
  }

  loadAllDashboardData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    type LoadData = { bookings: Booking[], customers: Customer[] };

    forkJoin({
      bookings: this.carRentalService
        .getAllBookings()
        .pipe(catchError(() => of([] as Booking[]))),
      customers: this.carRentalService
        .getCustomers()
        .pipe(catchError(() => of([] as Customer[]))),
    }).subscribe({
      next: ({ bookings, customers }: LoadData) => { // FIX: Explicit typing for destructuring
        // --- Manual Revenue Calculation ---
        const today = new Date();

        const todaysBookings = bookings.filter((b: Booking) => { // FIX: Explicit typing
          const bookingDate = new Date(b.bookingDate);
          return bookingDate.getFullYear() === today.getFullYear() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getDate() === today.getDate();
        });

        const todayTotalAmount = todaysBookings.reduce((sum: number, b: Booking) => sum + b.totalBillAmount, 0); // FIX: Explicit typing

        // --- End of Calculation ---

        this.dashboardData.set({
          todayTotalAmount: todayTotalAmount,
          totalBookings: bookings.length,
          totalCustomers: customers.length,
        });

        // Set All Bookings and Customers
        this.allBookings.set(bookings);
        this.allCustomers.set(customers);

        // Derive Recent Bookings
        this.recentBookings.set(
          bookings
            .sort(
              (a: Booking, b: Booking) => // FIX: Explicit typing
                new Date(b.bookingDate).getTime() -
                new Date(a.bookingDate).getTime()
            )
            .slice(0, 5)
        );

        // Derive Top Customers (e.g., first 6)
        this.topCustomers.set(customers.slice(0, 6));

        this.isLoading.set(false);
      },
      error: (err: any) => { // FIX: Explicit typing
        console.error('Critical dashboard load error:', err);
        this.isLoading.set(false);
        this.errorMessage.set(
          'A critical error occurred. Unable to load dashboard.'
        );
      },
    });
  }
}