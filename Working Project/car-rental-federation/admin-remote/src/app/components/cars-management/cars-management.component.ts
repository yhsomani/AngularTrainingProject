import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Car {
    carId: number;
    brand: string;
    model: string;
    year: number;
    color: string;
    dailyRate: number;
    regNo: string;
    carImage: string;
}

@Component({
    selector: 'app-cars-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cars-management.component.html'
})
export class CarsManagementComponent implements OnInit {
    private http = inject(HttpClient);

    // State Signals
    carList = signal<Car[]>([]);
    isLoading = signal(true);
    modalOpen = signal(false);
    isEditing = signal(false);
    notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
    searchQuery = signal('');

    // Active car for form
    activeCar: Car = this.getEmptyCar();

    // Computed filtered list
    get filteredCars(): Car[] {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.carList();
        return this.carList().filter(
            (c) =>
                c.brand.toLowerCase().includes(query) ||
                c.model.toLowerCase().includes(query) ||
                c.regNo.toLowerCase().includes(query) ||
                c.color.toLowerCase().includes(query)
        );
    }

    ngOnInit() {
        this.loadCars();
    }

    loadCars() {
        this.isLoading.set(true);
        this.http.get<Car[]>('http://localhost:4000/api/cars').subscribe({
            next: (data) => {
                this.carList.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to load cars. Is the backend running?');
                this.isLoading.set(false);
            }
        });
    }

    openModal(mode: 'new' | 'edit', car?: Car) {
        this.isEditing.set(mode === 'edit');
        if (mode === 'edit' && car) {
            this.activeCar = { ...car };
        } else {
            this.activeCar = this.getEmptyCar();
        }
        this.modalOpen.set(true);
    }

    closeModal() {
        this.modalOpen.set(false);
        this.activeCar = this.getEmptyCar();
    }

    saveCar() {
        if (!this.activeCar.brand || !this.activeCar.model || !this.activeCar.regNo) {
            this.showNotification('error', 'Please fill in all required fields');
            return;
        }

        if (this.isEditing()) {
            this.http.put('http://localhost:4000/api/car', this.activeCar).subscribe({
                next: () => {
                    this.loadCars();
                    this.closeModal();
                    this.showNotification('success', 'Car updated successfully');
                },
                error: () => this.showNotification('error', 'Failed to update car')
            });
        } else {
            this.http.post('http://localhost:4000/api/car', this.activeCar).subscribe({
                next: () => {
                    this.loadCars();
                    this.closeModal();
                    this.showNotification('success', 'Car added successfully');
                },
                error: () => this.showNotification('error', 'Failed to add car')
            });
        }
    }

    deleteCar(car: Car) {
        if (confirm(`Are you sure you want to delete ${car.brand} ${car.model}?`)) {
            this.http.delete(`http://localhost:4000/api/car?carId=${car.carId}`).subscribe({
                next: () => {
                    this.loadCars();
                    this.showNotification('success', 'Car deleted successfully');
                },
                error: () => this.showNotification('error', 'Failed to delete car')
            });
        }
    }

    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 4000);
    }

    private getEmptyCar(): Car {
        return {
            carId: 0,
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            dailyRate: 0,
            regNo: '',
            carImage: ''
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}
