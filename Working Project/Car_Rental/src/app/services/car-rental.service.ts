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
} from '../model/api.types';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class CarRentalService {
  private get isNative() {
    return Capacitor.isNativePlatform();
  }
  // Use the relative proxy path
  private baseUrl = this.isNative
    ? 'https://freeapi.miniprojectideas.com/api/CarRentalApp'
    : '/api/CarRentalApp';

  constructor(private http: HttpClient) { }

  // Dashboard
  getDashboardData(): Observable<DashboardData | null> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/GetDashboardData`)
      .pipe(
        map((response) => {
          try {
            if (!response.result || !response.data) {
              // Return a default object if the response is not successful
              return { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 };
            }
            // Safely parse all numeric values, handle both int/double type mismatches
            const todayTotal = parseFloat(
              response.data.todayTotalAmount?.toString() ?? '0'
            );
            return {
              todayTotalAmount: isNaN(todayTotal) ? 0 : todayTotal,
              totalBookings: 0, // API doesn't provide this, so default to 0
              totalCustomers: 0, // API doesn't provide this, so default to 0
            };
          } catch (err) {
            console.warn('Error parsing dashboard data:', err);
            // Return a default object in case of any parsing error
            return { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 };
          }
        }),
        catchError((error) => {
          console.error('Error fetching dashboard data:', error);
          // Return a default object on HTTP error
          return of({ todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 });
        })
      );
  }

  // Customer APIs
  getCustomers(): Observable<Customer[]> {
    return this.http
      .get<ApiResponse<Customer[]>>(`${this.baseUrl}/GetCustomers`)
      .pipe(
        map((response) => (response.result ? response.data || [] : [])),
        catchError(() => of([]))
      );
  }

  createCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/CreateNewCustomer`, customer)
      .pipe(
        map((response) => ({
          success: response.result,
          message: response.message || 'Customer created successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.message || 'Error creating customer',
          })
        )
      );
  }

  updateCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<ApiResponse<any>>(`${this.baseUrl}/UpdateCustomer`, customer)
      .pipe(
        map((response) => ({
          success: response.result,
          message: response.message || 'Customer updated successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.message || 'Error updating customer',
          })
        )
      );
  }

  deleteCustomer(id: number): Observable<{ success: boolean; message: string }> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      // FIX: Revert to the API's actual endpoint name (with typo)
      .delete<ApiResponse<any>>(`${this.baseUrl}/DeletCustomerById`, { params })
      .pipe(
        map((response) => ({
          success: response.result,
          message: response.message || 'Customer deleted successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.message || 'Error deleting customer',
          })
        )
      );
  }

  // Booking APIs
  getAllBookings(): Observable<Booking[]> {
    return this.http
      // FIX: Revert to the API's actual endpoint name (with typo)
      .get<ApiResponse<Booking[]>>(`${this.baseUrl}/geAllBookings`)
      .pipe(
        map((response) => (response.result ? response.data || [] : [])),
        catchError((error) => {
          console.error('Error fetching bookings:', error);
          return of([]);
        })
      );
  }

  filterBookings(filter: BookingFilter): Observable<Booking[]> {
    return this.http
      .post<ApiResponse<Booking[]>>(`${this.baseUrl}/FilterBookings`, filter)
      .pipe(
        map((response) => (response.result ? response.data || [] : [])),
        catchError(() => of([]))
      );
  }

  getBookingsByCustomerId(custId: number): Observable<Booking[]> {
    const params = new HttpParams().set('custId', custId.toString());
    return this.http
      // FIX: Revert to the API's actual endpoint name (with typo)
      .get<ApiResponse<Booking[]>>(`${this.baseUrl}/geAllBookingsByCustomerId`, {
        params,
      })
      .pipe(
        map((response) => (response.result ? response.data || [] : [])),
        catchError((error) => {
          console.error('Error fetching customer bookings:', error);
          return of([]);
        })
      );
  }

  getBookingById(bookingId: number): Observable<Booking | null> {
    const params = new HttpParams().set('bookingId', bookingId.toString());
    return this.http
      .get<ApiResponse<Booking>>(`${this.baseUrl}/GetBookingByBookingId`, {
        params,
      })
      .pipe(
        map((response) => (response.result ? response.data : null)),
        catchError(() => of(null))
      );
  }

  createBooking(
    booking: Booking
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/CreateNewBooking`, booking)
      .pipe(
        map((response) => ({
          success: response.result,
          message: response.message || 'Booking created successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.message || 'Error creating booking',
          })
        )
      );
  }

  deleteBooking(id: number): Observable<{ success: boolean; message: string }> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      // FIX: Revert to the API's actual endpoint name (with typo)
      .delete<ApiResponse<any>>(`${this.baseUrl}/DeletBookingById`, { params })
      .pipe(
        map((response) => ({
          success: response.result,
          message: response.message || 'Booking deleted successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.message || 'Error deleting booking',
          })
        )
      );
  }

  // Car APIs (Vehicle Component uses its own HTTP client, but Booking needs this)
  getCars(): Observable<CarModel[]> {
    return this.http
      .get<ApiResponse<CarModel[]>>(`${this.baseUrl}/GetCars`)
      .pipe(
        map((response) => (response.result ? response.data || [] : [])),
        catchError(() => of([]))
      );
  }
}