// src/app/pages/customer-register/customer-register.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterDetails, ApiResponse } from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';

type Notification = {
  type: 'success' | 'error';
  message: string;
};

// Initial state for the registration form, now includes email, password, and role
const EMPTY_REGISTER_DETAILS: RegisterDetails = {
  name: '',
  email: '',
  password: '',
  role: 'user', // Default to regular 'user' role
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
  newUserDetails = signal<RegisterDetails>({ ...EMPTY_REGISTER_DETAILS });
  isLoading = signal(false);
  notification = signal<Notification | null>(null);

  // --- Form Handling ---
  onRegister(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    this.isLoading.set(true);

    // Call the dedicated user registration endpoint
    this.carRentalService.registerUser(this.newUserDetails()).subscribe({
      next: (response: { success: boolean; message: string }) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message + ' You can now log in.');
          this.router.navigate(['/login']);
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error during registration:', error);
        this.showNotification('error', error.message || 'An unknown error occurred during registration.');
      },
    });
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.newUserDetails.set(EMPTY_REGISTER_DETAILS);
    this.notification.set(null);
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}