import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Customer } from '../../model/api.types';
import { CarRentalService } from '../../services/car-rental.service';

// --- Type Definitions ---

type Notification = {
  type: 'success' | 'error';
  message: string;
};

type ModalState = {
  mode: 'new' | 'edit' | 'delete' | 'closed';
  title: string;
  customer: Customer | null;
  message?: string;
};

const EMPTY_CUSTOMER: Customer = {
  customerId: 0,
  customerName: '',
  customerCity: '',
  mobileNo: '',
  email: '',
};

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer.html',
  styleUrls: ['./customer.css'], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerComponent implements OnInit {
  // --- Injected Services ---
  private carRentalService = inject(CarRentalService);

  // --- State Signals ---
  customers = signal<Customer[]>([]);
  isLoading = signal(false);
  notification = signal<Notification | null>(null);
  modal = signal<ModalState>({ mode: 'closed', title: '', customer: null });

  // A signal to hold the customer being edited or created
  activeCustomer = signal<Customer>({ ...EMPTY_CUSTOMER });

  ngOnInit() {
    this.loadCustomers();
  }

  // --- Data Loading ---
  loadCustomers() {
    this.isLoading.set(true);
    this.carRentalService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading.set(false);
        this.showNotification(
          'error',
          'Failed to load customers. Please try again.'
        );
      },
    });
  }

  // --- Modal Management ---
  openModal(mode: 'new' | 'edit' | 'delete', customer?: Customer) {
    if (mode === 'new') {
      this.activeCustomer.set({ ...EMPTY_CUSTOMER });
      this.modal.set({
        mode: 'new',
        title: 'Add New Customer',
        customer: null,
      });
    } else if (mode === 'edit' && customer) {
      this.activeCustomer.set({ ...customer });
      this.modal.set({
        mode: 'edit',
        title: `Edit Customer: ${customer.customerName}`,
        customer: customer,
      });
    } else if (mode === 'delete' && customer) {
      this.modal.set({
        mode: 'delete',
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${customer.customerName}? This action cannot be undone.`,
        customer: customer,
      });
    }
  }

  closeModal() {
    this.modal.set({ mode: 'closed', title: '', customer: null });
  }

  // --- Form & Data Handling ---
  handleFormSubmit(form: NgForm) {
    if (form.invalid) {
      this.showNotification('error', 'Please fill out all required fields.');
      return;
    }

    if (this.modal().mode === 'new') {
      this.createCustomer(this.activeCustomer());
    } else if (this.modal().mode === 'edit') {
      this.updateCustomer(this.activeCustomer());
    }
  }

  createCustomer(customer: Customer) {
    this.isLoading.set(true);
    this.carRentalService.createCustomer(customer).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadCustomers();
          this.closeModal();
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creating customer:', error);
        this.showNotification('error', 'An unknown error occurred.');
      },
    });
  }

  updateCustomer(customer: Customer) {
    this.isLoading.set(true);
    this.carRentalService.updateCustomer(customer).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadCustomers();
          this.closeModal();
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error updating customer:', error);
        this.showNotification('error', 'An unknown error occurred.');
      },
    });
  }

  handleDeleteConfirm() {
    const customer = this.modal().customer;
    if (!customer) return;

    this.isLoading.set(true);
    this.carRentalService.deleteCustomer(customer.customerId).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.showNotification('success', response.message);
          this.loadCustomers();
          this.closeModal();
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error deleting customer:', error);
        this.showNotification('error', 'An unknown error occurred.');
      },
    });
  }

  // --- Notification Logic ---
  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }
}
