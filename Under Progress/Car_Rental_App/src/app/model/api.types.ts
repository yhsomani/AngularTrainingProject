// src/app/model/api.types.ts
export interface ApiResponse<T> {
  message: string;
  result: boolean;
  data: T | null;
}

// NEW INTERFACE for the logged-in user details
export interface UserDetails {
  id: string; // MongoDB ObjectId
  email: string;
  name: string;
  role: 'admin' | 'user'; // Assuming roles are simple admin/user
}

// Updated interface to include password for registration form use
export interface RegisterDetails {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin'; // User selects role on registration
}

export interface Customer {
  customerId: number | string;
  customerName: string;
  customerCity: string;
  mobileNo: string;
  email: string;
}

export interface Booking {
  bookingId: number | string;
  bookingDate: string;
  discount: number;
  totalBillAmount: number;
  customerName: string;
  mobileNo: string;
  brand: string;
  model: string;
  bookingUid: string;
  carId: number | string;
  customerCity?: string;
  email?: string;
}

export interface BookingFilter {
  [key: string]: string | number | undefined;
  mobileNo?: string;
  customerName?: string;
  carId?: number | string;
  fromBookingDate?: string;
  toBookingDate?: string;
}

export interface DashboardData {
  todayTotalAmount: number;
  totalBookings: number;
  totalCustomers: number;
}

export interface CarModel {
  carId: number | string;
  brand: string;
  model: string;
  year: number;
  color: string;
  dailyRate: number;
  carImage: string;
  regNo: string;
}