import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  Booking,
  BookingFilter,
  CarModel,
  Customer,
} from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';
import { forkJoin, map, startWith } from 'rxjs';

// --- Type Definitions ---

type Notification = {
  type: 'success' | 'error';
  message: string;
};

type ModalState = {
  visible: boolean;
  title: string;
  booking: Booking | null;
  message?: string;
};

interface PageData {
  bookings: Booking[];
  customers: Customer[];
  cars: CarModel[];
}

const EMPTY_FILTER: BookingFilter = {
  customerName: '',
  mobileNo: '',
  fromBookingDate: '',
  toBookingDate: '',
};

const createEmptyBooking = (): Booking => ({
  bookingId: 0,
  bookingDate: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
  discount: 0,
  totalBillAmount: 0,
  customerName: '',
  mobileNo: '',
  brand: '',
  model: '',
  bookingUid: '',
  carId: 0,
  customerCity: '',
  email: '',
});

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css'], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent implements OnInit {
  // --- Injected Services ---
  private carRentalService = inject(CarRentalService);

  // --- State Signals ---
  bookings = signal<Booking[]>([]);
  customers = signal<Customer[]>([]);
  cars = signal<CarModel[]>([]);

  filter = { ...EMPTY_FILTER }; // Use simple object for 2-way binding
  newBooking = signal<Booking>(createEmptyBooking());

  isLoading = signal(false);
  notification = signal<Notification | null>(null);
  modal = signal<ModalState>({
    visible: false,
    title: '',
    booking: null,
  });

  ngOnInit() {
    this.loadInitialData();
  }

  // --- Data Loading ---
  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      bookings: this.carRentalService.getAllBookings(),
      customers: this.carRentalService.getCustomers(),
      cars: this.carRentalService.getCars(),
    }).subscribe({
      next: (data: PageData) => {
        this.bookings.set(data.bookings);
        this.customers.set(data.customers);
        this.cars.set(data.cars);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.isLoading.set(false);
        this.showNotification(
          'error',
          'Failed to load page data. Please refresh.'
        );
      },
    });
  }

  loadBookings() {
    this.isLoading.set(true);
    this.carRentalService.getAllBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showNotification('error', 'Failed to load bookings.');
      },
    });
  }

  // --- Form & Filter Logic ---
  onCustomerSelect(customerName: string) {
    const customer = this.customers().find(
      (c) => c.customerName === customerName
    );
    this.newBooking.update((booking) => ({
      ...booking,
      customerName: customer?.customerName || '',
      customerCity: customer?.customerCity || '',
      mobileNo: customer?.mobileNo || '',
      email: customer?.email || '',
    }));
  }

  onCarSelect(carId: number) {
    const car = this.cars().find((c) => c.carId === +carId);
    this.newBooking.update((booking) => ({
      ...booking,
      carId: car?.carId || 0,
      brand: car?.brand || '',
      model: car?.model || '',
    }));
  }

  applyFilter() {
    this.isLoading.set(true);

    // FIX: Reverted to sending the full filter object.
    // The API expects all keys, even if they are empty strings.
    this.carRentalService.filterBookings(this.filter).subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showNotification('error', 'Failed to apply filter.');
      },
    });
  }

  resetFilter() {
    this.filter = { ...EMPTY_FILTER };
    this.loadBookings();
  }

  // --- CRUD Operations ---
  createBooking(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.carRentalService.createBooking(this.newBooking()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadBookings();
          this.resetNewBooking(form);
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creating booking:', error);
        this.showNotification('error', 'An unknown error occurred.');
      },
    });
  }

  resetNewBooking(form: NgForm) {
    form.resetForm();
    this.newBooking.set(createEmptyBooking());
  }

  handleDeleteConfirm() {
    const booking = this.modal().booking;
    if (!booking) return;

    this.isLoading.set(true);
    this.carRentalService.deleteBooking(booking.bookingId).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadBookings();
        } else {
          this.showNotification('error', response.message);
        }
        this.closeModal();
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error deleting booking:', error);
        this.showNotification('error', 'An unknown error occurred.');
        this.closeModal();
      },
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

  closeModal() {
    this.modal.set({ visible: false, title: '', booking: null });
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}