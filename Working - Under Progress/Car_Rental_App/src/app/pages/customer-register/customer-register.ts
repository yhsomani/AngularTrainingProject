// src/app/pages/customer-register/customer-register.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterDetails, ApiResponse } from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';

type Notification = {
  type: 'success' | 'error';
  message: string;
};

// FIX: Initial state for the registration form must now include new required fields
const EMPTY_REGISTER_DETAILS: RegisterDetails = {
  name: '',
  email: '',
  password: '',
  role: 'user', // Default to regular 'user' role
  mobileNo: '', // ADDED
  customerCity: '', // ADDED
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

  // ---------------- Password Strength (Frontend Companion to Backend Validation) ----------------
  private passwordValue = computed(() => this.newUserDetails().password || '');

  passwordStrength = computed(() => {
    const pwd = this.passwordValue();
    const criteria = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\/]/.test(pwd)
    };
    const passed = Object.values(criteria).filter(Boolean).length;
    let score = (passed / 5) * 100; // percentage
    let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
    if (score >= 80) label = 'Strong';
    else if (score >= 60) label = 'Good';
    else if (score >= 40) label = 'Fair';
    return { score, label, criteria };
  });

  getPasswordMeterColor(): string {
    const score = this.passwordStrength().score;
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  }

  // --- Form Handling ---
  onRegister(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields, including mobile number and city.');
      return;
    }

    this.isLoading.set(true);

    // Call registerUser API
    this.carRentalService.registerUser(this.newUserDetails()).subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading.set(false);
        if (response.result) {
          this.showNotification('success', response.message + ' You can now log in.');
          this.resetForm(form);
          // Redirect to login after successful account creation
          setTimeout(() => this.router.navigate(['/login']), 1000);
        } else {
          // Check for specific duplicate error from backend
          if (response.message.includes('already exists')) {
            this.showNotification('error', 'Registration failed. A user or customer profile linked to this email/mobile number already exists.');
          } else {
            this.showNotification('error', response.message);
          }
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
    // Ensure the signal is reset with the new structure
    this.newUserDetails.set({ ...EMPTY_REGISTER_DETAILS });
    this.notification.set(null);
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}