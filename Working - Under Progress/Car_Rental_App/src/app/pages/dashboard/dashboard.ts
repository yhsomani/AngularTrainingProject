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
  // DashboardData now contains totalBookings and totalCustomers (FEATURE #1)
  dashboardData = signal<DashboardData | null>(null);
  allBookings = signal<Booking[]>([]);
  allCustomers = signal<Customer[]>([]);
  recentBookings = signal<Booking[]>([]);
  topCustomers = signal<Customer[]>([]);

  isLoading = signal(true);
  errorMessage = signal('');
  notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  today: Date = new Date();

  // EXPOSED FOR TEMPLATE
  isAdmin = this.carRentalService.isUserAdmin();

  ngOnInit() {
    this.loadAllDashboardData();
  }

  loadAllDashboardData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    type LoadData = { bookings: Booking[], customers: Customer[], summaryData: DashboardData | null };

    // Use forkJoin to fetch necessary data based on role
    const dataObservables = {
      // Admin fetches all bookings, User fetches only their own (logic handled in service)
      bookings: this.carRentalService
        .getAllBookings()
        .pipe(catchError(() => of([] as Booking[]))),
      // Admin fetches all customers, User fetches none (logic handled in service)
      customers: this.carRentalService
        .getCustomers()
        .pipe(catchError(() => of([] as Customer[]))),
      // Fetch consolidated dashboard data (Admin only fetches from API) (FEATURE #1)
      summaryData: this.carRentalService
        .getDashboardSummaryData()
        .pipe(catchError(() => of(null as DashboardData | null))),
    };

    forkJoin(dataObservables).subscribe({
      next: ({ bookings, customers, summaryData }: LoadData) => {

        // Use summaryData for key metrics (FEATURE #1)
        if (this.isAdmin && summaryData) {
          this.dashboardData.set(summaryData);
        } else if (!this.isAdmin) {
          // For non-admin, manually set the dashboard metrics based on their own bookings list
          this.dashboardData.set({
            todayTotalAmount: 0,
            totalCustomers: 0,
            totalBookings: bookings.length // User's total bookings
          });
        }

        // Set All Bookings and Customers
        this.allBookings.set(bookings);
        this.allCustomers.set(customers);

        // Derive Recent Bookings (applies to both admin and user list)
        this.recentBookings.set(
          // Sort by startDate, descending (new booking structure)
          bookings
            .sort(
              (a: Booking, b: Booking) =>
                new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime()
            )
            .slice(0, 5)
        );

        // Derive Top Customers (Admin only)
        this.topCustomers.set(customers.slice(0, 6));

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Critical dashboard load error:', err);
        this.isLoading.set(false);
        this.errorMessage.set(
          'A critical error occurred. Unable to load dashboard.'
        );
      },
    });
  }
}