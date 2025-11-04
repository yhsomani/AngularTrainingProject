import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  Booking,
  BookingFilter,
  CarModel,
  Customer,
  ApiResponse, // Added for clarity
} from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';
import { forkJoin } from 'rxjs';

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

const getTodayString = () => formatDate(new Date(), 'yyyy-MM-dd', 'en-US');

const createEmptyBooking = (): Booking => ({
  bookingId: 0,
  // Default dates for multi-day booking (FEATURE #2)
  startDate: getTodayString(),
  endDate: getTodayString(),
  discount: 0,
  totalBillAmount: 0,
  customerName: '',
  mobileNo: '',
  brand: '',
  model: '',
  bookingUid: '',
  carId: 0, // Using 0 as a temporary placeholder for carId string/number
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

  // Using a spread copy ensures we are not manipulating the constant reference
  filter: BookingFilter = { ...EMPTY_FILTER };
  newBooking = signal<Booking>(createEmptyBooking());

  isLoading = signal(false);
  notification = signal<Notification | null>(null);
  modal = signal<ModalState>({
    visible: false,
    title: '',
    booking: null,
  });

  isAdmin = this.carRentalService.isUserAdmin();
  currentUserId = this.carRentalService.getCurrentUserId();

  // Signal to store the daily rate of the currently selected car
  selectedCarRate = signal<number>(0);

  // Helper function to calculate duration (client-side display only)
  getDurationInDays(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return 0;
    }

    // Set time to midnight for accurate calculation
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    // Convert to days (milliseconds per day)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Add 1 day for inclusive count
    return diffDays + 1;
  }

  // Helper to calculate the estimated total bill
  getEstimatedTotalBill(): number {
    const rate = this.selectedCarRate();
    const duration = this.getDurationInDays(this.newBooking().startDate, this.newBooking().endDate);
    return rate * duration;
  }

  ngOnInit() {
    this.loadInitialData();
  }

  // --- Data Loading ---
  loadInitialData() {
    this.isLoading.set(true);

    forkJoin({
      // Service handles fetching all bookings (Admin) or user's bookings (User)
      bookings: this.carRentalService.getAllBookings(),
      // Service returns all customers (Admin) or an empty array (User)
      customers: this.carRentalService.getCustomers(),
      // Cars are always available for all authenticated users
      cars: this.carRentalService.getCars(),
    }).subscribe({
      next: (data: PageData) => {
        this.bookings.set(data.bookings);
        this.cars.set(data.cars);

        // --- Handle Customer List for non-admin ---
        let finalCustomers = data.customers;
        const userCustomer = this.carRentalService.getLoggedInUserAsCustomer();

        if (!this.isAdmin) {
          if (userCustomer) {
            // Non-admin can only book for themselves. Create a list with just them.
            finalCustomers = [userCustomer];

            // Pre-select their details in the new booking form to allow submission
            this.newBooking.set({
              ...this.newBooking(),
              customerName: userCustomer.customerName,
              mobileNo: userCustomer.mobileNo || '',
              customerCity: userCustomer.customerCity || '',
              email: userCustomer.email || '',
            });
          } else {
            this.showNotification('error', 'Could not retrieve logged-in user details. Please log in again.');
            finalCustomers = [];
          }
        }
        this.customers.set(finalCustomers);
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
    // Uses role-based logic in the service (either all or user-specific)
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
    if (!this.isAdmin) return;

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
    const carId = carIdString;
    const car = this.cars().find((c) => c.carId === carId);

    // Recalculate bill based on car rate and current duration (FEATURE #2)
    const duration = this.getDurationInDays(this.newBooking().startDate, this.newBooking().endDate);

    if (car) {
      this.selectedCarRate.set(car.dailyRate);
      const calculatedTotal = car.dailyRate * duration;

      this.newBooking.update((booking) => ({
        ...booking,
        carId: car?.carId || 0,
        brand: car?.brand || '',
        model: car?.model || '',
        // For non-admin, auto-set totalBillAmount to calculated value and discount to 0
        totalBillAmount: this.isAdmin ? booking.totalBillAmount : calculatedTotal,
        discount: this.isAdmin ? booking.discount : 0,
      }));
    } else {
      this.selectedCarRate.set(0);
      this.newBooking.update((booking) => ({
        ...booking,
        carId: 0,
        brand: '',
        model: '',
        totalBillAmount: this.isAdmin ? booking.totalBillAmount : 0,
        discount: this.isAdmin ? booking.discount : 0,
      }));
    }
  }

  // Recalculate logic when dates change (FEATURE #2)
  onDateChange() {
    if (!this.isAdmin) {
      // Recalculate estimated bill for user flow
      const duration = this.getDurationInDays(this.newBooking().startDate, this.newBooking().endDate);
      const calculatedTotal = this.selectedCarRate() * duration;
      this.newBooking.update((booking) => ({
        ...booking,
        totalBillAmount: calculatedTotal,
      }));
    }
  }

  applyFilter() {
    this.isLoading.set(true);

    const filterToSend: BookingFilter = {
      ...this.filter,
    };

    // Filter dates now target startDate and endDate fields (FEATURE #2)
    filterToSend.fromBookingDate = this.filter.fromBookingDate;
    filterToSend.toBookingDate = this.filter.toBookingDate;

    if (!this.isAdmin) {
      this.showNotification('error', 'Filtering is currently only available for administrators.');
      this.isLoading.set(false);
      return;
    }

    // Admin uses the filter endpoint
    this.carRentalService.filterBookings(filterToSend).subscribe({
      next: (bookings: Booking[]) => {
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
    this.loadBookings(); // Re-load initial data set (all for admin, user-specific for user)
  }

  // --- CRUD Operations ---
  createBooking(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    const bookingData = this.newBooking();

    // Check mandatory fields
    if (bookingData.carId === 0 || bookingData.carId === '0') {
      this.showNotification('error', 'Please select a car.');
      return;
    }
    if (!bookingData.customerName) {
      this.showNotification('error', 'Customer name is required.');
      return;
    }
    if (!bookingData.email) {
      this.showNotification('error', 'Customer email is required for booking validation.');
      return;
    }

    // Check date validity (FEATURE #2)
    const duration = this.getDurationInDays(bookingData.startDate, bookingData.endDate);
    if (duration <= 0) {
      this.showNotification('error', 'Invalid date range. Ensure Start Date is before or equal to End Date.');
      return;
    }

    if (!this.isAdmin) {
      // --- USER FLOW (Enforced Calculated Bill/Zero Discount) ---

      const userCustomer = this.carRentalService.getLoggedInUserAsCustomer();
      if (!userCustomer || !userCustomer.email) {
        this.showNotification('error', 'User details missing. Please re-login.');
        return;
      }

      if (this.selectedCarRate() <= 0) {
        this.showNotification('error', 'Daily price must be greater than zero. Please select a car.');
        return;
      }

      // Send minimal data, letting backend calculate totalBill (FEATURE #2)
      const minimalBookingData = {
        carId: bookingData.carId,
        startDate: bookingData.startDate, // NEW
        endDate: bookingData.endDate, // NEW
        customerName: userCustomer.customerName,
        email: userCustomer.email,
        // Backend ignores these, but we include them for TS/API compatibility
        discount: 0,
        totalBillAmount: 0,
      } as Booking;

      this.isLoading.set(true);
      this.carRentalService.createUserBooking(minimalBookingData).subscribe({
        next: (response: { success: boolean; message: string }) => {
          this.isLoading.set(false);
          if (response.success) {
            this.showNotification('success', response.message);
            this.loadBookings();
            this.resetNewBooking(form);
          } else {
            this.showNotification('error', response.message);
          }
        },
        error: (error: any) => {
          this.isLoading.set(false);
          console.error('Error creating user booking:', error);
          this.showNotification('error', error.error?.message || error.message || 'An unknown error occurred.');
        },
      });

    } else {
      // --- ADMIN FLOW (Full Control) ---

      if (bookingData.totalBillAmount <= 0) {
        this.showNotification('error', 'Total Bill Amount must be greater than zero for admin bookings.');
        return;
      }

      this.isLoading.set(true);
      this.carRentalService.createBooking(bookingData).subscribe({
        next: (response: { success: boolean; message: string }) => {
          this.isLoading.set(false);
          if (response.success) {
            this.showNotification('success', response.message);
            this.loadBookings();
            this.resetNewBooking(form);
          } else {
            this.showNotification('error', response.message);
          }
        },
        error: (error: any) => {
          this.isLoading.set(false);
          console.error('Error creating admin booking:', error);
          this.showNotification('error', error.error?.message || error.message || 'An unknown error occurred.');
        },
      });
    }
  }

  resetNewBooking(form: NgForm) {
    // Reset form fields
    form.resetForm();
    // Re-initialize the signal
    this.newBooking.set(createEmptyBooking());
    this.selectedCarRate.set(0);

    // Re-pre-select customer for non-admin user
    if (!this.isAdmin) {
      const userCustomer = this.carRentalService.getLoggedInUserAsCustomer();
      if (userCustomer) {
        this.newBooking.set({
          ...this.newBooking(),
          // FIX: Using customerName to resolve TS error
          customerName: userCustomer.customerName,
          mobileNo: userCustomer.mobileNo || '',
          customerCity: userCustomer.customerCity || '',
          email: userCustomer.email,
        });
      }
    }
  }

  handleDeleteConfirm() {
    const booking = this.modal().booking;
    if (!booking) return;

    if (!this.isAdmin) {
      this.showNotification('error', 'Only administrators can delete bookings.');
      this.closeModal();
      return;
    }

    this.isLoading.set(true);
    this.carRentalService.deleteBooking(booking.bookingId).subscribe({
      next: (response: { success: boolean; message: string }) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadBookings();
        } else {
          this.showNotification('error', response.message);
        }
        this.closeModal();
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error deleting booking:', error);
        this.showNotification('error', error.message || 'An unknown error occurred.');
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