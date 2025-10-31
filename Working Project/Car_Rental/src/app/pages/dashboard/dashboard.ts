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
  recentBookings = signal<Booking[]>([]); // Derived from allBookings
  topCustomers = signal<Customer[]>([]); // Derived from allCustomers

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

    // FIX: Remove the 'getDashboardData' call and calculate revenue manually
    forkJoin({
      bookings: this.carRentalService
        .getAllBookings()
        .pipe(catchError(() => of([] as Booking[]))),
      customers: this.carRentalService
        .getCustomers()
        .pipe(catchError(() => of([] as Customer[]))),
    }).subscribe({
      next: ({ bookings, customers }) => {
        // --- Manual Revenue Calculation ---
        const today = new Date();
        // Compare year, month, and day to find today's bookings
        const todaysBookings = bookings.filter(b => {
          const bookingDate = new Date(b.bookingDate);
          return bookingDate.getFullYear() === today.getFullYear() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getDate() === today.getDate();
        });

        // Sum the total amount for those bookings
        const todayTotalAmount = todaysBookings.reduce((sum, b) => sum + b.totalBillAmount, 0);
        // --- End of Calculation ---

        this.dashboardData.set({
          todayTotalAmount: todayTotalAmount, // Use the calculated value
          totalBookings: bookings.length,     // Use the count from the full list
          totalCustomers: customers.length,  // Use the count from the full list
        });

        // Set All Bookings and Customers
        this.allBookings.set(bookings);
        this.allCustomers.set(customers);

        // Derive Recent Bookings
        this.recentBookings.set(
          bookings
            .sort(
              (a, b) =>
                new Date(b.bookingDate).getTime() -
                new Date(a.bookingDate).getTime()
            )
            .slice(0, 5)
        );

        // Derive Top Customers (e.g., first 6)
        this.topCustomers.set(customers.slice(0, 6));

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Critical dashboard load error:', err);
        this.isLoading.set(false);
        this.errorMessage.set(
          'A critical error occurred. Unable to load dashboard.'
        );
      },
    });
  }
}