import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, catchError, debounceTime, switchMap, shareReplay, BehaviorSubject } from 'rxjs';
import {
    ApiResponse,
    Booking,
    BookingFilter,
    CarModel,
    Customer,
    DashboardData,
    AggregatedData,
    PaginatedResponse,
} from '../model/api.types';

@Injectable({
    providedIn: 'root',
})
export class CarRentalService {
    private baseUrl = '/api';
    private http: HttpClient;

    // Angular Signals for caching
    private _aggregatedData = signal<AggregatedData | null>(null);
    private _customersPage = signal<number>(1);
    private _bookingsPage = signal<number>(1);
    private _carsPage = signal<number>(1);

    // Computed signals for derived data
    public dashboardData = computed(() => this._aggregatedData()?.dashboard || { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 });
    public customers = computed(() => this._aggregatedData()?.customers || []);
    public bookings = computed(() => this._aggregatedData()?.bookings || []);
    public cars = computed(() => this._aggregatedData()?.cars || []);

    // Search subjects for debounced search
    private customerSearchSubject = new BehaviorSubject<string>('');
    private carSearchSubject = new BehaviorSubject<string>('');

    constructor(http?: HttpClient) {
        this.http = http || inject(HttpClient);

        // Set up debounced search observables
        this.customerSearchSubject.pipe(
            debounceTime(300),
            switchMap(searchTerm => this.searchCustomers(searchTerm))
        ).subscribe();

        this.carSearchSubject.pipe(
            debounceTime(300),
            switchMap(searchTerm => this.searchCars(searchTerm))
        ).subscribe();
    }

    // Load all data with caching (single API call optimization)
    loadAggregatedData(): Observable<AggregatedData> {
        if (this._aggregatedData()) {
            return of(this._aggregatedData()!);
        }

        return this.http.get<AggregatedData>(`${this.baseUrl}/aggregated-data`).pipe(
            shareReplay(1),
            map(data => {
                this._aggregatedData.set(data);
                return data;
            }),
            catchError(() => of({
                dashboard: { todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 },
                customers: [],
                bookings: [],
                cars: []
            }))
        );
    }

    // Refresh cached data after mutations
    private refreshCache(): void {
        this._aggregatedData.set(null);
    }

    // Dashboard
    getDashboardData(): Observable<DashboardData> {
        return this.loadAggregatedData().pipe(
            map(data => data.dashboard),
            catchError(() => of({ todayTotalAmount: 0, totalBookings: 0, totalCustomers: 0 }))
        );
    }

    // Customer APIs with pagination and caching
    getCustomers(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Customer>> {
        return this.http.get<PaginatedResponse<Customer>>(`${this.baseUrl}/customers?page=${page}&limit=${limit}`).pipe(
            catchError(() => of({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }))
        );
    }

    // Debounced search for customers
    searchCustomers(searchTerm: string): Observable<Customer[]> {
        if (!searchTerm.trim()) {
            return of(this.customers());
        }

        return of(this.customers().filter(customer =>
            customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.mobileNo.includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }

    // Public method to trigger customer search
    setCustomerSearch(searchTerm: string): void {
        this.customerSearchSubject.next(searchTerm);
    }

    createCustomer(customer: Customer): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/customers`, customer).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to create customer' }))
        );
    }

    updateCustomer(customer: Customer): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/customers/${customer.customerId}`, customer).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to update customer' }))
        );
    }

    deleteCustomer(id: number): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/customers/${id}`).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to delete customer' }))
        );
    }

    // Booking APIs with pagination and caching
    getAllBookings(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Booking>> {
        return this.http.get<PaginatedResponse<Booking>>(`${this.baseUrl}/bookings?page=${page}&limit=${limit}`).pipe(
            catchError(() => of({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }))
        );
    }

    filterBookings(filter: BookingFilter): Observable<Booking[]> {
        return this.loadAggregatedData().pipe(
            map(data => data.bookings.filter(b =>
                (!filter.mobileNo || b.mobileNo === filter.mobileNo) &&
                (!filter.customerName || b.customerName === filter.customerName) &&
                (!filter.carId || b.carId === filter.carId) &&
                (!filter.fromBookingDate || b.bookingDate >= filter.fromBookingDate) &&
                (!filter.toBookingDate || b.bookingDate <= filter.toBookingDate)
            )),
            catchError(() => of([]))
        );
    }

    getBookingsByCustomerId(custId: number): Observable<Booking[]> {
        return this.loadAggregatedData().pipe(
            map(data => data.bookings.filter(b => b.customerId === custId)),
            catchError(() => of([]))
        );
    }

    getBookingById(bookingId: number): Observable<Booking | null> {
        return this.http.get<Booking>(`${this.baseUrl}/bookings/${bookingId}`).pipe(
            catchError(() => of(null))
        );
    }

    createBooking(booking: Omit<Booking, 'bookingId'>): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/bookings`, booking).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to create booking' }))
        );
    }

    deleteBooking(id: number): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/bookings/${id}`).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to delete booking' }))
        );
    }

    updateBooking(booking: Booking): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/bookings/${booking.bookingId}`, booking).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to update booking' }))
        );
    }

    // Car APIs with pagination and caching
    getCars(page: number = 1, limit: number = 10): Observable<PaginatedResponse<CarModel>> {
        return this.http.get<PaginatedResponse<CarModel>>(`${this.baseUrl}/cars?page=${page}&limit=${limit}`).pipe(
            catchError(() => of({ data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }))
        );
    }

    // Debounced search for cars
    searchCars(searchTerm: string): Observable<CarModel[]> {
        if (!searchTerm.trim()) {
            return of(this.cars());
        }

        return of(this.cars().filter(car =>
            car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.regNo.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }

    // Public method to trigger car search
    setCarSearch(searchTerm: string): void {
        this.carSearchSubject.next(searchTerm);
    }

    createCar(car: CarModel): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/cars`, car).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to create car' }))
        );
    }

    updateCar(car: CarModel): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(`${this.baseUrl}/cars/${car.carId}`, car).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to update car' }))
        );
    }

    deleteCar(id: number): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/cars/${id}`).pipe(
            map(response => {
                this.refreshCache();
                return response;
            }),
            catchError(() => of({ success: false, message: 'Failed to delete car' }))
        );
    }
}