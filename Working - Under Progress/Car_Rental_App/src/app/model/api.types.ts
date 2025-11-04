// src/app/model/api.types.ts
export interface ApiResponse<T> {
  message: string;
  result: boolean;
  data: T | null;
}

// User details returned from login
export interface UserDetails {
  id: string; // MongoDB ObjectId (of the User record)
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// NEW interface for profile updates
export interface ProfileUpdateDetails {
  name: string;
  email: string;
  mobileNo: string;
  customerCity: string;
  currentPassword?: string;
  newPassword?: string;
}

// Data model for the user registration form (includes password and role)
export interface RegisterDetails {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  mobileNo: string; // REQUIRED for Customer profile creation
  customerCity: string; // REQUIRED for Customer profile creation
}

export interface Customer {
  customerId: number | string; // MongoDB ObjectId (of the Customer record)
  customerName: string;
  customerCity: string;
  mobileNo: string;
  email: string;
}

export interface Booking {
  bookingId: number | string;
  startDate: string; // UPDATED from bookingDate for multi-day booking
  endDate: string; // NEW field for multi-day booking
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