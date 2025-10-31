import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiResponse, CarModel } from '../../model/api.types';

// Interface for our notification
type Notification = {
  type: 'success' | 'error';
  message: string;
};

// Interface for our modal
type ModalState = {
  visible: boolean;
  title: string;
  message: string;
  carId: number | null;
};
@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle.html',
  styleUrls: ['./vehicle.css'], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleComponent implements OnInit {
  // --- State Signals ---
  newCar = signal<CarModel>(this.createEmptyCar());
  carList = signal<CarModel[]>([]);
  isLoading = signal(false);
  isDuplicateRegNo = signal(false);
  notification = signal<Notification | null>(null);
  modalState = signal<ModalState>({
    visible: false,
    title: '',
    message: '',
    carId: null,
  });

  // --- Constants ---
  private placeholderImage =
    "data:image/svg+xml;utf8," +
    "%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%2060'%3E" +
    "%3Crect%20width='100'%20height='60'%20fill='%23e0e0e0'/%3E" +
    "%3Ctext%20x='50'%20y='35'%20font-size='12'%20fill='%23666'%20text-anchor='middle'%3ENo%20Image%3C/text%3E%3C/svg%3E";
  private currentYear = new Date().getFullYear();
  private http = inject(HttpClient);
  // FIX: Use the relative proxy path, not the full URL
  private apiBaseUrl = '/api/CarRentalApp';

  ngOnInit(): void {
    this.getAllCars();
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

  // --- Data Fetching ---

  getAllCars(): void {
    this.isLoading.set(true);
    this.http.get<ApiResponse<CarModel[]>>(`${this.apiBaseUrl}/GetCars`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.result && Array.isArray(res.data)) {
          this.carList.set(res.data);
        } else {
          this.showNotification(
            'error',
            res.message || 'Failed to fetch vehicles.'
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.showNotification('error', this.formatError(error, 'fetching'));
      },
    });
  }

  onSaveCar(vehicleForm: NgForm): void {
    if (!this.validateForm(vehicleForm)) return;

    this.isLoading.set(true);
    this.http
      .post<ApiResponse<any>>(`${this.apiBaseUrl}/CreateNewCar`, this.newCar())
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.result) {
            this.getAllCars();
            this.resetForm(vehicleForm);
            this.showNotification(
              'success',
              res.message || 'Vehicle saved successfully.'
            );
          } else {
            this.showNotification(
              'error',
              res.message || 'Failed to save vehicle.'
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.showNotification('error', this.formatError(error, 'saving'));
        },
      });
  }

  onUpdateCar(vehicleForm: NgForm): void {
    if (!this.validateForm(vehicleForm)) return;

    this.isLoading.set(true);
    this.http
      .put<ApiResponse<any>>(`${this.apiBaseUrl}/UpdateCar`, this.newCar())
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.result) {
            this.getAllCars();
            this.resetForm(vehicleForm);
            this.showNotification(
              'success',
              res.message || 'Vehicle updated successfully.'
            );
          } else {
            this.showNotification(
              'error',
              res.message || 'Failed to update vehicle.'
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.showNotification('error', this.formatError(error, 'updating'));
        },
      });
  }

  onDeleteCarById(carId: number): void {
    this.isLoading.set(true);
    this.http
      .delete<ApiResponse<any>>(
        `${this.apiBaseUrl}/DeleteCarbyCarId?carId=${carId}`
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.result) {
            this.getAllCars();
            this.showNotification(
              'success',
              res.message || 'Vehicle deleted successfully.'
            );
          } else {
            this.showNotification(
              'error',
              res.message || 'Failed to delete vehicle.'
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.showNotification('error', this.formatError(error, 'deleting'));
        },
      });
  }

  // --- Form & UI Logic ---

  onEdit(car: CarModel): void {
    this.newCar.set({ ...car });
    this.isDuplicateRegNo.set(false);
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.newCar.set(this.createEmptyCar());
    this.isDuplicateRegNo.set(false);
  }

  getSafeImage(url?: string): string {
    if (!url?.trim()) {
      return this.placeholderImage;
    }

    try {
      if (url.startsWith('data:image')) return url;

      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }

      const parsed = new URL(fullUrl);
      // Basic validation: check if the hostname contains a dot.
      if (['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.')) {
        return fullUrl;
      }
    } catch {
      // Fallthrough to placeholder for any parsing errors
    }

    return this.placeholderImage;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  // --- Modal Logic ---

  confirmDelete(car: CarModel): void {
    this.modalState.set({
      visible: true,
      carId: car.carId,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${car.brand} ${car.model} (Reg: ${car.regNo})? This action cannot be undone.`,
    });
  }

  handleModalConfirm(): void {
    const carId = this.modalState().carId;
    if (carId) {
      this.onDeleteCarById(carId);
    }
    this.closeModal();
  }

  closeModal(): void {
    this.modalState.set({
      visible: false,
      title: '',
      message: '',
      carId: null,
    });
  }

  // --- Notification Logic ---

  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000); // Auto-dismiss
  }

  // --- Validation & Helpers ---

  private validateForm(vehicleForm: NgForm): boolean {
    if (vehicleForm.invalid) {
      vehicleForm.form.markAllAsTouched();
      return false;
    }

    const car = this.newCar();

    if (car.year < 1900 || car.year > this.currentYear) {
      this.showNotification(
        'error',
        `Year must be between 1900 and ${this.currentYear}.`
      );
      return false;
    }

    if (car.dailyRate < 0) {
      this.showNotification('error', 'Daily rate cannot be negative.');
      return false;
    }

    if (!this.isValidUrl(car.carImage)) {
      this.showNotification(
        'error',
        'Please enter a valid image URL (jpg, png, gif, webp) or data URL.'
      );
      return false;
    }

    const isDuplicate = this.carList().some(
      (c) =>
        c.regNo.toLowerCase() === car.regNo.toLowerCase() && c.carId !== car.carId
    );
    this.isDuplicateRegNo.set(isDuplicate);
    if (isDuplicate) {
      return false;
    }

    return true;
  }

  private isValidUrl(url: string): boolean {
    if (!url) return true; // URL is optional

    if (url.startsWith('data:image')) {
      return true;
    }

    try {
      new URL(url);
      return url.match(/\.(jpeg|jpg|png|gif|webp)$/i) !== null;
    } catch {
      return false;
    }
  }

  private createEmptyCar(): CarModel {
    return {
      carId: 0,
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      dailyRate: 0,
      carImage: '',
      regNo: '',
    };
  }

  private formatError(
    error: HttpErrorResponse,
    action: string
  ): string {
    if (error.status === 0) {
      return `Network error: Unable to connect to server while ${action}.`;
    }
    if (error.error?.message?.includes('Car Registration No Already Exist')) {
      this.isDuplicateRegNo.set(true);
      return 'Registration number already exists.';
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return `An unknown error occurred while ${action}. (Status: ${error.status})`;
  }
}