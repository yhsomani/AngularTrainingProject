import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

interface DashboardMetrics {
    totalCustomers: number;
    totalBookings: number;
    todayTotalAmount: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    // Data Signals
    dashboardData = signal<DashboardMetrics | null>(null);
    recentBookings = signal<any[]>([]);
    topCustomers = signal<any[]>([]);

    // UI Signals
    isLoading = signal<boolean>(true);
    errorMessage = signal<string>('');
    notification = signal<{ type: 'success' | 'error', message: string } | null>(null);

    // Today's date for display
    today: Date = new Date();

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadAllDashboardData();
    }

    loadAllDashboardData() {
        this.isLoading.set(true);
        this.errorMessage.set('');

        // Use forkJoin to fetch all dashboard dependencies in parallel
        forkJoin({
            customers: this.http.get<any[]>('http://localhost:4000/api/customers'),
            bookings: this.http.get<any[]>('http://localhost:4000/api/bookings')
        }).subscribe({
            next: ({ customers, bookings }) => {
                this.processMetrics(customers, bookings);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Dashboard load failed', err);
                this.errorMessage.set('Failed to load dashboard metrics. Is the backend running?');
                this.isLoading.set(false);
            }
        });
    }

    private processMetrics(customers: any[], bookings: any[]) {
        // 1. Calculate Aggregates
        const totalCustomers = customers.length;
        const totalBookings = bookings.length;

        // 2. Calculate Today's Revenue
        const today = new Date();
        const todaysBookings = bookings.filter(b => {
            const bookingDate = new Date(b.bookingDate);
            return bookingDate.getFullYear() === today.getFullYear() &&
                bookingDate.getMonth() === today.getMonth() &&
                bookingDate.getDate() === today.getDate();
        });
        const todayTotalAmount = todaysBookings.reduce((sum, b) => sum + (b.totalBillAmount || 0), 0);

        this.dashboardData.set({
            totalCustomers,
            totalBookings,
            todayTotalAmount
        });

        // 3. Process Recent Activity (Last 5 bookings)
        const sortedBookings = [...bookings].sort((a, b) =>
            new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
        );
        this.recentBookings.set(sortedBookings.slice(0, 5));

        // 4. Process Top Customers (Aggregating booking counts)
        const customerMap = new Map<number, { customerName: string, bookingCount: number }>();

        bookings.forEach(b => {
            if (!customerMap.has(b.customerId)) {
                customerMap.set(b.customerId, { customerName: b.customerName, bookingCount: 0 });
            }
            const entry = customerMap.get(b.customerId)!;
            entry.bookingCount++;
        });

        const topList = Array.from(customerMap.values())
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);

        this.topCustomers.set(topList);
    }

    // --- Notification ---
    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 5000);
    }
}