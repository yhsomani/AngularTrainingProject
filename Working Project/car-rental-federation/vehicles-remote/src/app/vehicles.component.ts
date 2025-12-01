import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
    selector: 'app-vehicles',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
    templateUrl: './vehicles.component.html',
    styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit {
    // Signals for Reactive UI
    carList = signal<Car[]>([]);
    isLoading = signal<boolean>(false);
    notification = signal<{ type: 'success' | 'error', message: string } | null>(null);
    isDuplicateRegNo = signal(false);

    // Modal State
    modalState = signal({ visible: false, title: '', message: '' });

    // Form State
    newCar = signal<Car>({
        carId: 0,
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        dailyRate: 0,
        regNo: '',
        carImage: ''
    });

    private carToDelete: Car | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.getAllCars();
    }

    getAllCars() {
        this.isLoading.set(true);
        this.http.get<Car[]>('http://localhost:4000/api/cars').subscribe({
            next: (res) => {
                this.carList.set(res);
                this.isLoading.set(false);
            },
            error: () => {
                this.showNotification('error', 'Failed to load fleet data');
                this.isLoading.set(false);
            }
        });
    }

    // Handle file input selection and convert to data URL for preview/storage
    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) {
            this.showNotification('error', 'Only image files (jpg, png, gif, webp) are allowed.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string | null;
            if (result) {
                // Set the carImage to the data URL so the preview and save use the image
                this.newCar.update((c) => ({ ...c, carImage: result }));
            }
        };
        reader.onerror = () => {
            this.showNotification('error', 'Failed to read selected image.');
        };
        reader.readAsDataURL(file);
    }

    // --- Validation ---

    private checkDuplicateRegNo(): boolean {
        const car = this.newCar();
        const isDuplicate = this.carList().some(
            (c) =>
                c.regNo.toLowerCase() === car.regNo.toLowerCase() && c.carId !== car.carId
        );
        this.isDuplicateRegNo.set(isDuplicate);
        return isDuplicate;
    }

    // --- CRUD Operations ---

    onSaveCar(form: NgForm) {
        if (form.invalid) return;
        if (this.checkDuplicateRegNo()) {
            this.showNotification('error', 'Registration number already exists.');
            return;
        }

        this.isLoading.set(true);

        // Auto-fill random image if empty (for demo polish)
        const payload = this.newCar();
        if (!payload.carImage) {
            payload.carImage = `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80`;
        }

        this.http.post('http://localhost:4000/api/car', payload).subscribe({
            next: () => {
                this.getAllCars();
                this.resetForm(form);
                this.showNotification('success', 'Vehicle added to fleet');
            },
            error: () => {
                this.showNotification('error', 'Could not save vehicle');
                this.isLoading.set(false);
            }
        });
    }

    onUpdateCar(form: NgForm) {
        if (form.invalid) return;
        if (this.checkDuplicateRegNo()) {
            this.showNotification('error', 'Registration number already exists.');
            return;
        }

        this.isLoading.set(true);

        this.http.put('http://localhost:4000/api/car', this.newCar()).subscribe({
            next: () => {
                this.getAllCars();
                this.resetForm(form);
                this.showNotification('success', 'Vehicle details updated');
            },
            error: () => {
                this.showNotification('error', 'Update failed');
                this.isLoading.set(false);
            }
        });
    }

    onDeleteCar() {
        if (!this.carToDelete) return;
        this.isLoading.set(true);

        this.http.delete(`http://localhost:4000/api/car?carId=${this.carToDelete.carId}`).subscribe({
            next: () => {
                this.getAllCars();
                this.closeModal();
                this.showNotification('success', 'Vehicle removed from fleet');
            },
            error: () => {
                this.showNotification('error', 'Delete failed');
                this.isLoading.set(false);
            }
        });
    }

    // --- Interactions ---

    onEdit(car: Car) {
        this.newCar.set({ ...car });
        this.isDuplicateRegNo.set(false);
    }

    confirmDelete(car: Car) {
        this.carToDelete = car;
        this.modalState.set({
            visible: true,
            title: 'Delete Vehicle',
            message: `Are you sure you want to remove ${car.brand} ${car.model} (${car.regNo}) from the fleet?`
        });
    }

    handleModalConfirm() {
        if (this.modalState().title.includes('Delete')) {
            this.onDeleteCar();
        }
    }

    onDrop(event: CdkDragDrop<Car[]>) {
        // Optimistic UI update for drag and drop reordering
        const currentList = this.carList();
        moveItemInArray(currentList, event.previousIndex, event.currentIndex);
        this.carList.set([...currentList]); // Trigger signal update
    }

    resetForm(form?: NgForm) {
        if (form) {
            form.resetForm();
        }
        this.newCar.set({
            carId: 0,
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            dailyRate: 0,
            regNo: '',
            carImage: ''
        });
        this.isDuplicateRegNo.set(false);
    }

    resetNewCar() {
        this.newCar.set({
            carId: 0,
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            dailyRate: 0,
            regNo: '',
            carImage: ''
        });
        this.isDuplicateRegNo.set(false);
    }

    // --- Utilities ---

    getSafeImage(url: string): string {
        if (!url?.trim()) {
            return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
        }

        // Handle data URLs
        if (url.startsWith('data:image')) return url;

        return url;
    }

    onImgError(event: any) {
        event.target.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
    }

    closeModal() {
        this.modalState.set({ visible: false, title: '', message: '' });
        this.carToDelete = null;
    }

    showNotification(type: 'success' | 'error', message: string) {
        this.notification.set({ type, message });
        setTimeout(() => this.notification.set(null), 5000);
    }
}