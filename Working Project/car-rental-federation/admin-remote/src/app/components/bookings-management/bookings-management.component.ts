import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Booking {
    bookingId: number;
    customerId: number;
    customerName: string;
    carId: number;
    brand: string;
    model: string;
    bookingDate: string;
    bookingUid: string;
    totalBillAmount: number;
    discount: number;
}

interface Customer {
    customerId: number;
    customerName: string;
}

interface Car {
    carId: number;
    brand: string;
    model: string;
    dailyRate: number;
}

@Component({
    selector: 'app-bookings-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bookings-management.component.html'
})
export class BookingsManagementComponent implements OnInit {
    private http = inject(HttpClient);

    // State Signals
    bookingList = signal<Booking[]>([]);
    customerList = signal<Customer[]>([]);
    carList = signal<Car[]>([]);
    isLoading = signal(true);
    modalOpen = signal(false);
    isEditing = signal(false);
    notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
    searchQuery = signal('');

    // Active booking for form
    activeBooking: Partial<Booking> = this.getEmptyBooking();

    // Computed filtered list
    get filteredBookings(): Booking[] {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.bookingList();
        return this.bookingList().filter(
            (b) =>
                b.customerName?.toLowerCase().includes(query) ||
                b.bookingUid?.toLowerCase().includes(query) ||
                b.brand?.toLowerCase().includes(query) ||
                b.model?.toLowerCase().includes(query)
        );
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);

        // Load bookings
        this.http.get<Booking[]>('http://localhost:4000/api/bookings').subscribe({
            next: (data) => {
                this.bookingList.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to load bookings. Is the backend running?');
                this.isLoading.set(false);
            }
        });

        // Load customers for dropdown
        this.http.get<Customer[]>('http://localhost:4000/api/customers').subscribe({
            next: (data) => this.customerList.set(data)
        });

        // Load cars for dropdown
        this.http.get<Car[]>('http://localhost:4000/api/cars').subscribe({
            next: (data) => this.carList.set(data)
        });
    }

    openModal(mode: 'new' | 'edit', booking?: Booking) {
        this.isEditing.set(mode === 'edit');
        if (mode === 'edit' && booking) {
            this.activeBooking = { ...booking };
        } else {
            this.activeBooking = this.getEmptyBooking();
        }
        this.modalOpen.set(true);
    }

    closeModal() {
        this.modalOpen.set(false);
        this.activeBooking = this.getEmptyBooking();
    }

    saveBooking() {
        if (!this.activeBooking.customerId || !this.activeBooking.carId || !this.activeBooking.bookingDate) {
            this.showNotification('error', 'Please fill in all required fields');
            return;
        }

        if (this.isEditing()) {
            this.http.put('http://localhost:4000/api/booking', this.activeBooking).subscribe({
                next: () => {
                    this.loadData();
                    this.closeModal();
                    this.showNotification('success', 'Booking updated successfully');
                },
                error: () => this.showNotification('error', 'Failed to update booking')
            });
        } else {
            this.http.post('http://localhost:4000/api/booking', this.activeBooking).subscribe({
                next: () => {
                    this.loadData();
                    this.closeModal();
                    this.showNotification('success', 'Booking created successfully');
                },
                error: () => this.showNotification('error', 'Failed to create booking')
            });
        }
    }

    deleteBooking(booking: Booking) {
        if (confirm(`Are you sure you want to delete booking ${booking.bookingUid}?`)) {
            this.http.delete(`http://localhost:4000/api/booking?bookingId=${booking.bookingId}`).subscribe({
                next: () => {
                    this.loadData();
                    this.showNotification('success', 'Booking deleted successfully');
                },
                error: () => this.showNotification('error', 'Failed to delete booking')
            });
        }
    }

    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 4000);
    }

    private getEmptyBooking(): Partial<Booking> {
        return {
            bookingId: 0,
            customerId: 0,
            carId: 0,
            bookingDate: new Date().toISOString().split('T')[0],
            discount: 0
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
