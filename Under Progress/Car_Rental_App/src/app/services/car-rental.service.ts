// src/app/services/car-rental.service.ts
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
  UserDetails,
  RegisterDetails
} from '../model/api.types';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';

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
      const details: UserDetails = userJson ? JSON.parse(userJson) : null;
      return details ? { ...details, role: details.role || 'user' } : null;
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

  // METHOD FOR USER REGISTRATION (sets password and role)
  registerUser(details: RegisterDetails): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.authBaseUrl}/register`, details)
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

  // --- Customer APIs (Role Filtering) ---
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

  // --- Booking APIs (Role Filtering) ---
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