import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, map, catchError, BehaviorSubject } from 'rxjs';
import {
  ApiResponse,
  Booking,
  BookingFilter,
  CarModel,
  Customer,
  DashboardData,
} from '../model/api.types';
import { Capacitor } from '@capacitor/core';

interface Data {
  customers: Customer[];
  bookings: Booking[];
  cars: CarModel[];
  dashboard: DashboardData;
}

@Injectable({
  providedIn: 'root',
})
export class CarRentalService {
  private data: Data = {
    customers: [],
    bookings: [],
    cars: [],
    dashboard: { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 }
  };
  private dataLoaded$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadData();
  }

  private loadData() {
    this.http.get<Data>('/assets/data.json').pipe(
      catchError(() => of(this.data))
    ).subscribe(data => {
      this.data = data;
      this.dataLoaded$.next(true);
    });
  }

  // Dashboard
  getDashboardData(): Observable<DashboardData | null> {
    return this.dataLoaded$.pipe(
      map(() => this.data.dashboard)
    );
  }

  // Customer APIs
  getCustomers(): Observable<Customer[]> {
    return this.dataLoaded$.pipe(
      map(() => this.data.customers)
    );
  }

  createCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.dataLoaded$.pipe(
      map(() => {
        const newId = Math.max(...this.data.customers.map(c => c.customerId), 0) + 1;
        const newCustomer: Customer = { ...customer, customerId: newId };
        this.data.customers.push(newCustomer);
        this.updateDashboard();
        return { success: true, message: 'Customer created successfully' };
      })
    );
  }

  updateCustomer(
    customer: Customer
  ): Observable<{ success: boolean; message: string }> {
    return this.dataLoaded$.pipe(
      map(() => {
        const index = this.data.customers.findIndex(c => c.customerId === customer.customerId);
        if (index !== -1) {
          this.data.customers[index] = customer;
          return { success: true, message: 'Customer updated successfully' };
        }
        return { success: false, message: 'Customer not found' };
      })
    );
  }

  deleteCustomer(id: number): Observable<{ success: boolean; message: string }> {
    return this.dataLoaded$.pipe(
      map(() => {
        const index = this.data.customers.findIndex(c => c.customerId === id);
        if (index !== -1) {
          this.data.customers.splice(index, 1);
          this.updateDashboard();
          return { success: true, message: 'Customer deleted successfully' };
        }
        return { success: false, message: 'Customer not found' };
      })
    );
  }

  // Booking APIs
  getAllBookings(): Observable<Booking[]> {
    return this.dataLoaded$.pipe(
      map(() => this.data.bookings)
    );
  }

  filterBookings(filter: BookingFilter): Observable<Booking[]> {
    return this.dataLoaded$.pipe(
      map(() => {
        return this.data.bookings.filter(b =>
          (!filter.mobileNo || b.mobileNo === filter.mobileNo) &&
          (!filter.customerName || b.customerName === filter.customerName) &&
          (!filter.carId || b.carId === filter.carId) &&
          (!filter.fromBookingDate || b.bookingDate >= filter.fromBookingDate) &&
          (!filter.toBookingDate || b.bookingDate <= filter.toBookingDate)
        );
      })
    );
  }

  getBookingsByCustomerId(custId: number): Observable<Booking[]> {
    return this.dataLoaded$.pipe(
      map(() => this.data.bookings.filter(b => b.customerId === custId))
    );
  }

  getBookingById(bookingId: number): Observable<Booking | null> {
    return this.dataLoaded$.pipe(
      map(() => this.data.bookings.find(b => b.bookingId === bookingId) || null)
    );
  }

  createBooking(
    booking: Omit<Booking, 'bookingId'>
  ): Observable<{ success: boolean; message: string }> {
    return this.dataLoaded$.pipe(
      map(() => {
        const newId = Math.max(...this.data.bookings.map(b => b.bookingId), 0) + 1;
        const newBooking: Booking = { ...booking, bookingId: newId };
        this.data.bookings.push(newBooking);
        this.updateDashboard();
        return { success: true, message: 'Booking created successfully' };
      })
    );
  }

  deleteBooking(id: number): Observable<{ success: boolean; message: string }> {
    return this.dataLoaded$.pipe(
      map(() => {
        const index = this.data.bookings.findIndex(b => b.bookingId === id);
        if (index !== -1) {
          this.data.bookings.splice(index, 1);
          this.updateDashboard();
          return { success: true, message: 'Booking deleted successfully' };
        }
        return { success: false, message: 'Booking not found' };
      })
    );
  }

  // Car APIs
  getCars(): Observable<CarModel[]> {
    return this.dataLoaded$.pipe(
      map(() => this.data.cars)
    );
  }

  private updateDashboard() {
    this.data.dashboard.totalCustomers = this.data.customers.length;
    this.data.dashboard.totalBookings = this.data.bookings.length;
    this.data.dashboard.todayTotalAmount = this.data.bookings.reduce((sum, b) => sum + b.totalBillAmount, 0);
  }
}