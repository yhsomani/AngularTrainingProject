// Car_Rental_App/src/app/services/car-rental.service.ts
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
  RegisterDetails,
  ProfileUpdateDetails
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

  // FIX: Use localhost:5000 for development (with proxy fallback for browser)
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

  /**
   * Generates a Customer-like object for the currently logged-in user 
   * based on the UserDetails.
   * @returns Customer or null
   */
  getLoggedInUserAsCustomer(): Customer | null {
    const user = this.getAuthDetails();
    if (!user) return null;

    return {
      customerId: user.id, // The User ID is deliberately the Customer ID on the backend
      customerName: user.name,
      mobileNo: '', // Placeholder, will be overwritten by data from getCustomerProfileByUserId
      email: user.email,
      customerCity: '', // Placeholder, will be overwritten by data from getCustomerProfileByUserId
    } as Customer;
  }

  // --- AUTH APIs ---
  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.authBaseUrl}/login`, credentials)
      .pipe(
        map(response => {
          if (response.result && response.token && response.data) {
            localStorage.setItem('authToken', response.token);
            // Ensure the data stored includes the ID from the backend
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
    // NOTE: Actual backend logout call is optional as token expiry handles sessions
    this.http.post(`${this.authBaseUrl}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
  }

  // METHOD FOR USER REGISTRATION (sets password and role)
  registerUser(details: RegisterDetails): Observable<ApiResponse<any>> {
    // This endpoint now creates both the User and Customer records
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

  // NEW METHOD FOR PROFILE UPDATE (FEATURE #4)
  updateUserDetails(details: ProfileUpdateDetails): Observable<ApiResponse<any>> {
    // Requires a valid JWT token (handled by interceptor)
    return this.http
      .put<ApiResponse<any>>(`${this.authBaseUrl}/update`, details)
      .pipe(
        map(response => {
          if (response.result && response.data) {
            // Update local storage user details on successful update
            const oldDetails = this.getAuthDetails();
            if (oldDetails) {
              // The backend should return the updated UserDetails
              const newDetails: UserDetails = response.data as UserDetails;
              localStorage.setItem('userDetails', JSON.stringify({
                ...oldDetails,
                ...newDetails,
              }));
            }
          }
          return response;
        }),
        catchError((error) => {
          return of({
            result: false,
            message: error.error?.message || 'Server error during update',
            data: null,
          } as ApiResponse<any>);
        })
      );
  }

  // NEW METHOD: Fetch customer profile by user ID (Problem 4A)
  getCustomerProfileByUserId(userId: string | number): Observable<Customer | null> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http
      .get<ApiResponse<Customer>>(`${this.dataBaseUrl}/GetCustomerProfileById`, { params })
      .pipe(
        map((response: ApiResponse<Customer>) => (response.result ? response.data : null)),
        catchError((error: any) => {
          console.error('Error fetching customer profile:', error);
          return of(null);
        })
      );
  }

  // --- DASHBOARD API (FEATURE #1: Complete Dashboard Data) ---
  getDashboardSummaryData(): Observable<DashboardData | null> {
    if (!this.isUserAdmin()) {
      // Return default empty data for non-admin to prevent unnecessary API call
      return of({ todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 });
    }
    return this.http
      .get<ApiResponse<DashboardData>>(`${this.dataBaseUrl}/GetDashboardData`)
      .pipe(
        map((response: ApiResponse<DashboardData>) => (response.result ? response.data : null)),
        catchError(() => of(null))
      );
  }


  // --- Customer APIs (Role Filtering) ---
  getCustomers(): Observable<Customer[]> {
    // RBAC: Only Admin fetches all customers
    if (this.isUserAdmin()) {
      return this.http
        .get<ApiResponse<Customer[]>>(`${this.dataBaseUrl}/GetCustomers`)
        .pipe(
          map((response: ApiResponse<Customer[]>) => (response.result ? response.data || [] : [])),
          catchError(() => of([]))
        );
    } else {
      // For non-admin, return an empty list
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
      .delete<ApiResponse<any>>(`${this.dataBaseUrl}/DeleteCustomerById`, { params }) // FIX: Corrected typo in API endpoint name to match backend route
      .pipe(
        // FIXED: Corrected map function syntax
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
    // RBAC: Logic handles fetching all or user-specific bookings
    if (this.isUserAdmin()) {
      return this.http
        .get<ApiResponse<Booking[]>>(`${this.dataBaseUrl}/geAllBookings`) // Backend route name typo (geAllBookings) retained
        .pipe(
          map((response: ApiResponse<Booking[]>) => (response.result ? response.data || [] : [])),
          catchError((error: any) => {
            console.error('Error fetching ALL bookings:', error);
            return of([]);
          })
        );
    } else {
      // For standard users, fetch only their own bookings using their ID
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
      }) // Backend route name typo (geAllBookingsByCustomerId) retained
      .pipe(
        map((response: ApiResponse<Booking[]>) => (response.result ? response.data || [] : [])),
        catchError((error: any) => {
          console.error('Error fetching customer bookings:', error);
          return of([]);
        })
      );
  }

  // ADMIN Booking creation (allows discount/custom bill amount)
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

  // USER Booking creation (enforces no discount, calculated bill amount)
  createUserBooking(
    booking: Booking
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<any>>(`${this.dataBaseUrl}/CreateUserBooking`, booking)
      .pipe(
        map((response: ApiResponse<any>) => ({
          success: response.result,
          message: response.message || 'Car booked successfully',
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
      .delete<ApiResponse<any>>(`${this.dataBaseUrl}/DeletBookingById`, { params }) // Backend route name typo (DeletBookingById) retained
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