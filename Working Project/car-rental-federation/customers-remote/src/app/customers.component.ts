import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Customer {
    customerId: number;
    customerName: string;
    mobileNo: string;
    email: string;
    city: string;
}

type ModalState = {
    mode: 'new' | 'edit' | 'delete' | 'closed';
    title: string;
    customer: Customer | null;
    message?: string;
};

const EMPTY_CUSTOMER: Customer = {
    customerId: 0,
    customerName: '',
    mobileNo: '',
    email: '',
    city: ''
};

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.component.html',
    styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
    // Data Signals
    customerList = signal<Customer[]>([]);

    // UI State Signals
    isLoading = signal(false);
    notification = signal<{ type: 'success' | 'error', message: string } | null>(null);

    // Modal State
    modal = signal<ModalState>({ mode: 'closed', title: '', customer: null });

    // Active customer for form editing
    activeCustomer = signal<Customer>({ ...EMPTY_CUSTOMER });

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.getAllCustomers();
    }

    getAllCustomers() {
        this.isLoading.set(true);
        this.http.get<Customer[]>('http://localhost:4000/api/customers').subscribe({
            next: (res) => {
                this.customerList.set(res);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to load customers');
                this.isLoading.set(false);
            }
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
        this.http.post('http://localhost:4000/api/customer', customer).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.showNotification('success', 'Customer added successfully');
                this.getAllCustomers();
                this.closeModal();
            },
            error: () => {
                this.isLoading.set(false);
                this.showNotification('error', 'Failed to add customer');
            }
        });
    }

    updateCustomer(customer: Customer) {
        this.isLoading.set(true);
        this.http.put('http://localhost:4000/api/customer', customer).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.showNotification('success', 'Customer updated successfully');
                this.getAllCustomers();
                this.closeModal();
            },
            error: () => {
                this.isLoading.set(false);
                this.showNotification('error', 'Update failed');
            }
        });
    }

    handleDeleteConfirm() {
        const customer = this.modal().customer;
        if (!customer) return;

        this.isLoading.set(true);
        this.http.delete(`http://localhost:4000/api/customer?customerId=${customer.customerId}`).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.showNotification('success', 'Customer deleted successfully');
                this.getAllCustomers();
                this.closeModal();
            },
            error: () => {
                this.isLoading.set(false);
                this.showNotification('error', 'Delete failed');
            }
        });
    }

    // --- Notification Logic ---
    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 5000);
    }
}
