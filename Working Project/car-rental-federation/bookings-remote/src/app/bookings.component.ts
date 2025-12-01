import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Interfaces matching the new UI needs
interface Booking {
    bookingId: number;
    customerId: number;
    customerName: string;
    carId: number;
    brand: string;
    model: string;
    bookingDate: Date | string;
    bookingUid: string;
    totalBillAmount: number;
    discount: number;
}

interface Customer {
    customerId: number;
    customerName: string;
    mobileNo: string;
    email: string;
    city: string;
}

interface Car {
    carId: number;
    brand: string;
    model: string;
    regNo: string;
    dailyRate: number;
}

interface BookingFilter {
    customerName: string;
    mobileNo: string;
    fromBookingDate: string;
    toBookingDate: string;
}

type ModalState = {
    visible: boolean;
    title: string;
    booking: Booking | null;
    message?: string;
};

const EMPTY_FILTER: BookingFilter = {
    customerName: '',
    mobileNo: '',
    fromBookingDate: '',
    toBookingDate: '',
};

const createEmptyBooking = (): Partial<Booking> => ({
    bookingId: 0,
    customerId: 0,
    carId: 0,
    discount: 0,
    totalBillAmount: 0,
    bookingDate: new Date().toISOString().split('T')[0]
});

@Component({
    selector: 'app-bookings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bookings.component.html',
    styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
    // State Signals
    bookingList = signal<Booking[]>([]);
    customerList = signal<Customer[]>([]);
    carList = signal<Car[]>([]);
    isLoading = signal<boolean>(false);

    // UI State Signals
    highlightBookingIds = signal<number[]>([]);
    notification = signal<{ type: 'success' | 'error', message: string } | null>(null);

    // Modal State
    modal = signal<ModalState>({
        visible: false, title: '', booking: null, message: ''
    });

    // Filter object for 2-way binding
    filter: BookingFilter = { ...EMPTY_FILTER };

    // Active Booking for form
    activeBooking = signal<Partial<Booking>>(createEmptyBooking());

    // Selected customer computed from activeBooking.customerId
    selectedCustomer = computed(() => {
        const customerId = this.activeBooking().customerId;
        return this.customerList().find(c => c.customerId === customerId) || null;
    });

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.getAllBookings();
        this.loadDependencies();
    }

    // --- Data Loading ---

    loadDependencies() {
        // Parallel loading of dropdown data
        this.http.get<Customer[]>('http://localhost:4000/api/customers').subscribe({
            next: (data) => this.customerList.set(data),
            error: () => this.showNotification('error', 'Failed to load customers')
        });

        this.http.get<Car[]>('http://localhost:4000/api/cars').subscribe({
            next: (data) => this.carList.set(data),
            error: () => this.showNotification('error', 'Failed to load fleet')
        });
    }

    getAllBookings() {
        this.isLoading.set(true);
        this.http.get<Booking[]>('http://localhost:4000/api/bookings').subscribe({
            next: (res) => {
                this.bookingList.set(res);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.showNotification('error', 'Could not fetch bookings');
                this.isLoading.set(false);
            }
        });
    }

    // --- Filter Logic ---

    applyFilter() {
        this.isLoading.set(true);
        this.http.post<Booking[]>('http://localhost:4000/api/bookings/filter', this.filter).subscribe({
            next: (res) => {
                this.bookingList.set(res);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to apply filter');
                this.isLoading.set(false);
            }
        });
    }

    resetFilter() {
        this.filter = { ...EMPTY_FILTER };
        this.getAllBookings();
    }

    // --- Selection Handlers ---

    onCustomerSelect(customerId: number) {
        this.activeBooking.update(booking => ({
            ...booking,
            customerId: +customerId
        }));
    }

    onCarSelect(carId: number) {
        this.activeBooking.update(booking => ({
            ...booking,
            carId: +carId
        }));
    }

    // --- Form Handling ---

    handleFormSubmit(form: NgForm) {
        if (form.invalid) {
            this.showNotification('error', 'Please fill out all required fields.');
            return;
        }

        if (this.activeBooking().bookingId === 0) {
            this.createBooking();
        } else {
            this.updateBooking();
        }
    }

    createBooking() {
        this.isLoading.set(true);
        const payload = { ...this.activeBooking() };

        this.http.post<any>('http://localhost:4000/api/booking', payload).subscribe({
            next: (res) => {
                this.getAllBookings();
                this.resetFormData();
                this.showNotification('success', 'Booking created successfully');

                // Highlight the new item temporarily
                if (res && res.bookingId) {
                    this.highlightBookingIds.update(ids => [...ids, res.bookingId]);
                    setTimeout(() => {
                        this.highlightBookingIds.update(ids => ids.filter(id => id !== res.bookingId));
                    }, 3000);
                }
            },
            error: () => {
                this.showNotification('error', 'Failed to create booking');
                this.isLoading.set(false);
            }
        });
    }

    updateBooking() {
        this.isLoading.set(true);
        this.http.put('http://localhost:4000/api/booking', this.activeBooking()).subscribe({
            next: () => {
                this.getAllBookings();
                this.resetFormData();
                this.showNotification('success', 'Booking updated');
            },
            error: () => {
                this.showNotification('error', 'Update failed');
                this.isLoading.set(false);
            }
        });
    }

    onEdit(booking: Booking) {
        // Create a copy to edit
        this.activeBooking.set({
            ...booking,
            // Ensure date format is correct for input[type="date"]
            bookingDate: typeof booking.bookingDate === 'string'
                ? booking.bookingDate
                : new Date(booking.bookingDate).toISOString().split('T')[0]
        });
    }

    // --- Modal Logic ---

    openDeleteModal(booking: Booking) {
        this.modal.set({
            visible: true,
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete Booking ID: ${booking.bookingId}? This action cannot be undone.`,
            booking: booking,
        });
    }

    handleDeleteConfirm() {
        const booking = this.modal().booking;
        if (!booking) return;

        this.isLoading.set(true);
        this.http.delete(`http://localhost:4000/api/booking?bookingId=${booking.bookingId}`).subscribe({
            next: () => {
                this.getAllBookings();
                this.showNotification('success', 'Booking deleted');
                this.closeModal();
            },
            error: () => {
                this.showNotification('error', 'Delete failed');
                this.isLoading.set(false);
                this.closeModal();
            }
        });
    }

    closeModal() {
        this.modal.set({ visible: false, title: '', booking: null });
    }

    // --- Helpers ---

    resetForm(form: NgForm) {
        form.resetForm();
        this.resetFormData();
    }

    resetFormData() {
        this.activeBooking.set(createEmptyBooking());
    }

    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 5000);
    }

    formatDate(date: Date | string): string {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    }
}