import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarRentalService } from '../../services/car-rental.service'; // NEW IMPORT

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // Use signals for form state
  userName = signal(''); // Will be used as 'email' for the backend
  password = signal('');
  errorMessage = signal('');

  router = inject(Router);
  carRentalService = inject(CarRentalService); // NEW INJECTION

  onLogin() {
    // Reset error message on new login attempt
    this.errorMessage.set('');

    // NOTE: The client uses 'username' but the backend expects 'email'.
    // The service handles this mapping.
    this.carRentalService.login({ email: this.userName(), password: this.password() }).subscribe({
      next: (response) => {
        if (response.result && response.token) {
          // Store the JWT token for subsequent requests
          localStorage.setItem('authToken', response.token);
          this.router.navigate(['/dashboard']);
        } else {
          // Handle API-reported error (e.g., 'Invalid credentials')
          this.errorMessage.set(response.message || 'Login failed. Please check your credentials.');
        }
      },
      error: (err) => {
        // Handle network/unhandled errors
        console.error('Login service error:', err);
        this.errorMessage.set('A network error occurred. Could not connect to the server.');
      },
    });
  }
}