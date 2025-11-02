// src/app/pages/profile/profile.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
// FIXED: Correctly import ProfileUpdateDetails from the model file
import { UserDetails, Customer, ApiResponse, ProfileUpdateDetails } from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';

type Notification = {
  type: 'success' | 'error';
  message: string;
};

// Initial state derived from current logged-in user
const getInitialProfile = (userService: CarRentalService): ProfileUpdateDetails => {
  const user = userService.getAuthDetails();
  if (!user) return { name: '', email: '', mobileNo: '', customerCity: '' };

  // Placeholder data from JWT/LocalStorage
  return {
    name: user.name,
    email: user.email,
    mobileNo: '', // Will be updated by loadProfileDetails
    customerCity: '', // Will be updated by loadProfileDetails
  };
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private carRentalService = inject(CarRentalService);

  // Initialize from user data
  profile = signal<ProfileUpdateDetails>(getInitialProfile(this.carRentalService));

  // Separate signals for password fields (to avoid storing them permanently)
  currentPassword = signal('');
  newPassword = signal('');

  isLoading = signal(false);
  notification = signal<Notification | null>(null);

  // Expose role for display
  userRole = this.carRentalService.getAuthDetails()?.role || 'user';

  ngOnInit(): void {
    // FIX: Logic to fetch full customer details (mobile/city) goes here
    this.loadProfileDetails();
  }

  loadProfileDetails() {
    this.isLoading.set(true);
    const userId = this.carRentalService.getCurrentUserId();
    if (!userId) {
      this.showNotification('error', 'User ID not found. Please log in again.');
      this.isLoading.set(false);
      return;
    }

    // Fetch the customer profile which contains mobileNo and customerCity
    this.carRentalService.getCustomerProfileByUserId(userId).subscribe({
      next: (customer) => {
        this.isLoading.set(false);
        const userDetails = this.carRentalService.getAuthDetails();
        if (customer && userDetails) {
          // Update the profile signal with the full details
          this.profile.set({
            name: userDetails.name, // Name/Email from UserDetails (localStorage/token)
            email: userDetails.email,
            mobileNo: customer.mobileNo,
            customerCity: customer.customerCity,
          });
        } else {
          this.showNotification('error', 'Failed to load customer details. Please check server logs.');
        }
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error loading customer profile:', error);
        this.showNotification('error', 'Failed to fetch customer profile for editing.');
      },
    });
  }

  onUpdateProfile(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    // Validate password fields
    if (this.newPassword() && this.newPassword().length < 6) {
      this.showNotification('error', 'New password must be at least 6 characters long.');
      return;
    }
    if (this.newPassword() && !this.currentPassword()) {
      this.showNotification('error', 'Current password is required to set a new password.');
      return;
    }

    this.isLoading.set(true);

    const updatePayload: ProfileUpdateDetails = {
      ...this.profile(),
      currentPassword: this.currentPassword() || undefined,
      newPassword: this.newPassword() || undefined,
    };

    this.carRentalService.updateUserDetails(updatePayload).subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading.set(false);
        if (response.result) {
          this.showNotification('success', response.message);

          // Clear password fields on success
          this.currentPassword.set('');
          this.newPassword.set('');

          // Re-set the profile signal to ensure latest data from local storage/response is used
          this.profile.set(getInitialProfile(this.carRentalService));
          this.loadProfileDetails(); // Re-fetch customer profile after successful update

        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('Error updating profile:', error);
        this.showNotification('error', error.message || 'An unknown error occurred during update.');
      },
    });
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}