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
  // Supports string (MongoDB ObjectId) or number
  bookingId: 0,
  bookingDate: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
  discount: 0,
  totalBillAmount: 0,
  customerName: '',
  mobileNo: '',
  brand: '',
  model: '',
  bookingUid: '',
  // Supports string (MongoDB ObjectId) or number
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

  // NEW: Storing admin status for UI control (e.g., hiding create/delete buttons for non-admins)
  isAdmin = this.carRentalService.isUserAdmin();

  ngOnInit() {
    this.loadInitialData();
  }

  // --- Data Loading ---
  loadInitialData() {
    this.isLoading.set(true);

    // The service handles role-based filtering for both bookings and customers.
    forkJoin({
      bookings: this.carRentalService.getAllBookings(), // Role-filtered bookings
      customers: this.carRentalService.getCustomers(), // Admins get all, Users get empty/relevant subset
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
    // This call is now role-filtered in the service
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

  onCarSelect(carIdString: string) {
    // carIdString is the string value from the <select> element (MongoDB ObjectId string)
    const carId = carIdString;
    const car = this.cars().find((c) => c.carId === carId);

    this.newBooking.update((booking) => ({
      ...booking,
      // Store the string ID
      carId: car?.carId || 0,
      brand: car?.brand || '',
      model: car?.model || '',
    }));
  }

  applyFilter() {
    this.isLoading.set(true);

    // Filter to be sent to API, ensuring carId is passed as string if present
    const filterToSend: BookingFilter = {
      ...this.filter,
      carId: this.filter.carId ? this.filter.carId.toString() : undefined
    };

    // The current user's bookings are filtered server-side, this applies additional filter params
    this.carRentalService.filterBookings(filterToSend).subscribe({
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
    // Only allow admin to create from this form. Users should use a public form.
    if (!this.isAdmin) {
      this.showNotification('error', 'Only administrators can create bookings through the admin portal form.');
      return;
    }

    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    // Simple validation for car selection
    if (this.newBooking().carId === 0 || this.newBooking().carId === '0') {
      this.showNotification('error', 'Please select a car.');
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
    // bookingId is passed as string|number, service handles the string conversion
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
    if (!this.isAdmin) {
      this.showNotification('error', 'Only administrators can delete bookings.');
      return;
    }

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