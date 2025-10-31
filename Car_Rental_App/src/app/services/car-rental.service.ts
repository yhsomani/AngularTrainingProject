// Git Upload Project/Car_Rental_App/src/app/services/car-rental.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import {
  ApiResponse,
  Booking,
  BookingFilter,
  CarModel,
  Customer,
  DashboardData,
  UserDetails
} from '../model/api.types';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';

// Define a simple type for login credentials
interface Credentials {
  email: string;
  password: string;
}

export interface AuthResponse extends ApiResponse<UserDetails> {
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CarRentalService {
  private get isNative() {
    return Capacitor.isNativePlatform();
  }

  private dataBaseUrl = this.isNative
    ? 'http://localhost:5000/api/CarRentalApp'
    : '/api/CarRentalApp';

  private authBaseUrl = this.isNative
    ? 'http://localhost:5000/api/auth'
    : '/api/auth';

  constructor(private http: HttpClient, private router: Router) { }

  // --- AUTH UTILITIES ---
  getAuthDetails(): UserDetails | null {
    const userJson = localStorage.getItem('userDetails');
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  isUserAdmin(): boolean {
    return this.getAuthDetails()?.role === 'admin';
  }

  getCurrentUserId(): string | number | null {
    return this.getAuthDetails()?.id || null;
  }

  // --- AUTH APIs ---
  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authBaseUrl}/login`, credentials)
      .pipe(
        map(response => {
          if (response.result && response.token && response.data) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userDetails', JSON.stringify(response.data));
          } else {
            this.logout();
          }
          return response;
        }),
        catchError((error) => {
          this.logout();
          console.error('Login error:', error);
          return of({
            result: false,
            message: error.error?.message || 'Server error during login',
            data: null,
            token: undefined,
          } as AuthResponse);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userDetails');
  }

  register(credentials: Credentials & { name: string }): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.authBaseUrl}/register`, credentials)
      .pipe(
        catchError((error) => {
          return of({
            result: false,
            message: error.error?.message || 'Server error during registration',
            data: null,
          } as ApiResponse<any>);
        })
      );
  }

  // --- Dashboard ---
  getDashboardData(): Observable<DashboardData | null> {
    return this.http
      .get<ApiResponse<any>>(`${this.dataBaseUrl}/GetDashboardData`)
      .pipe(
        map((response: ApiResponse<any>) => {
          try {
            if (!response.result || !response.data) {
              return { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 };
            }
            const todayTotal = parseFloat(
              response.data.todayTotalAmount?.toString() ?? '0'
            );
            return {
              todayTotalAmount: isNaN(todayTotal) ? 0 : todayTotal,
              totalBookings: 0,
              totalCustomers: 0,
            };
          } catch (err) {
            console.warn('Error parsing dashboard data:', err);
            return { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 };
          }
        }),
        catchError((error: any) => {
          console.error('Error fetching dashboard data:', error);
          return of({ todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 });
        })
      );
  }

  // --- Customer APIs ---
  getCustomers(): Observable<Customer[]> {
    if (this.isUserAdmin()) {
      return this.http
        .get<ApiResponse<Customer[]>>(`${this.dataBaseUrl}/GetCustomers`)
        .pipe(
          map((response: ApiResponse<Customer[]>) => (response.result ? response.data || [] : [])),
          catchError(() => of([]))
        );
    } else {
      return of([]);
    }
  }

  // FIX: Restoring createCustomer
  createCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<any>>(`${this.dataBaseUrl}/CreateNewCustomer`, customer)
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Customer created successfully',
        })),
        catchError((error: any) =>
          of({
            success: false,
            message: error.error?.message || 'Error creating customer',
          })
        )
      );
  }

  updateCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<ApiResponse<any>>(`${this.dataBaseUrl}/UpdateCustomer`, customer)
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Customer updated successfully',
        })),
        catchError((error: any) =>
          of({
            success: false,
            message: error.error?.message || 'Error updating customer',
          })
        )
      );
  }

  deleteCustomer(id: number | string): Observable<{ success: boolean; message: string }> {
    // Casting id to string before calling toString for safety across string|number
    const params = new HttpParams().set('id', String(id));
    return this.http
      .delete<ApiResponse<any>>(`${this.dataBaseUrl}/DeletCustomerById`, { params })
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Customer deleted successfully',
        })),
        catchError((error: any) =>
          of({
            success: false,
            message: error.error?.message || 'Error deleting customer',
          })
        )
      );
  }

  // --- Booking APIs ---
  getAllBookings(): Observable<Booking[]> {
    if (this.isUserAdmin()) {
      return this.http
        .get<ApiResponse<Booking[]>>(`${this.dataBaseUrl}/geAllBookings`)
        .pipe(
          map((response: ApiResponse<Booking[]>) => (response.result ? response.data || [] : [])),
          catchError((error: any) => {
            console.error('Error fetching bookings:', error);
            return of([]);
          })
        );
    } else {
      const userId = this.getCurrentUserId();
      if (userId) {
        return this.getBookingsByCustomerId(userId);
      }
      return of([]);
    }
  }

  // FIX: Restoring filterBookings
  filterBookings(filter: BookingFilter): Observable<Booking[]> {
    return this.http
      .post<ApiResponse<Booking[]>>(`${this.dataBaseUrl}/FilterBookings`, filter)
      .pipe(
        map((response: ApiResponse<Booking[]>) => (response.result ? response.data || [] : [])),
        catchError(() => of([]))
      );
  }

  getBookingsByCustomerId(custId: number | string): Observable<Booking[]> {
    const params = new HttpParams().set('custId', String(custId));
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.dataBaseUrl}/geAllBookingsByCustomerId`, {
        params,
      })
      .pipe(
        map((response: ApiResponse<Booking[]>) => (response.result ? response.data || [] : [])),
        catchError((error: any) => {
          console.error('Error fetching customer bookings:', error);
          return of([]);
        })
      );
  }

  getBookingById(bookingId: number | string): Observable<Booking | null> {
    const params = new HttpParams().set('bookingId', String(bookingId));
    return this.http
      .get<ApiResponse<Booking>>(`${this.dataBaseUrl}/GetBookingByBookingId`, {
        params,
      })
      .pipe(
        map((response: ApiResponse<Booking>) => (response.result ? response.data : null)),
        catchError(() => of(null))
      );
  }

  createBooking(
    booking: Booking
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<any>>(`${this.dataBaseUrl}/CreateNewBooking`, booking)
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Booking created successfully',
        })),
        catchError((error: any) =>
          of({
            success: false,
            message: error.error?.message || 'Error creating booking',
          })
        )
      );
  }

  deleteBooking(id: number | string): Observable<{ success: boolean; message: string }> {
    const params = new HttpParams().set('id', String(id));
    return this.http
      .delete<ApiResponse<any>>(`${this.dataBaseUrl}/DeletBookingById`, { params })
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Booking deleted successfully',
        })),
        catchError((error: any) =>
          of({
            success: false,
            message: error.error?.message || 'Error deleting booking',
          })
        )
      );
  }

  getCars(): Observable<CarModel[]> {
    return this.http
      .get<ApiResponse<CarModel[]>>(`${this.dataBaseUrl}/GetCars`)
      .pipe(
        map((response: ApiResponse<CarModel[]>) => (response.result ? response.data || [] : [])),
        catchError(() => of([]))
      );
  }
}