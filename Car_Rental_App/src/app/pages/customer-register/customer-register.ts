// src/app/pages/customer-register/customer-register.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Customer, ApiResponse } from '../../model/api.types'; // CORRECTED PATH
import { CarRentalService } from '../../services/car-rental.service'; // CORRECTED PATH

type Notification = {
  type: 'success' | 'error';
  message: string;
};

const EMPTY_CUSTOMER: Customer = {
  customerId: 0,
  customerName: '',
  customerCity: '',
  mobileNo: '',
  email: '',
};

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-register.html',
  styleUrls: ['./customer-register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRegisterComponent {
  // --- Injected Services ---
  private carRentalService = inject(CarRentalService);
  private router = inject(Router);

  // --- State Signals ---
  newCustomer = signal<Customer>({ ...EMPTY_CUSTOMER });
  isLoading = signal(false);
  notification = signal<Notification | null>(null);

  // --- Form Handling ---
  onRegister(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    const customerToCreate: Customer = {
      ...this.newCustomer(),
      customerId: 0,
    };

    this.isLoading.set(true);
    // Added explicit type for the subscribe block
    this.carRentalService.createCustomer(customerToCreate).subscribe({
      next: (response: { success: boolean; message: string }) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message + ' You can now log in to the admin portal (if allowed).');
          this.resetForm(form);
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error: any) => { // Kept 'any' for the error object as its structure is complex (HttpErrorResponse)
        this.isLoading.set(false);
        console.error('Error creating customer:', error);
        this.showNotification('error', 'An unknown error occurred during registration.');
      },
    });
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.newCustomer.set(EMPTY_CUSTOMER);
    this.notification.set(null);
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}