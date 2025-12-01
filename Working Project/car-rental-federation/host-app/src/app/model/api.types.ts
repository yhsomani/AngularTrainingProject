export interface ApiResponse<T> {
  message: string;
  result: boolean;
  data: T | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface AggregatedData {
  dashboard: DashboardData;
  customers: Customer[];
  bookings: Booking[];
  cars: CarModel[];
}

export interface Customer {
  customerId: number;
  customerName: string;
  customerCity: string;
  mobileNo: string;
  email: string;
}

export interface Booking {
  bookingId: number;
  bookingDate: string;
  discount: number;
  totalBillAmount: number;
  customerName: string;
  mobileNo: string;
  brand: string;
  model: string;
  bookingUid: string;
  carId: number;
  customerId?: number;
  customerCity?: string;
  email?: string;
}

export interface BookingFilter {
  [key: string]: string | number | undefined;
  mobileNo?: string;
  customerName?: string;
  carId?: number;
  fromBookingDate?: string;
  toBookingDate?: string;
}

export interface DashboardData {
  todayTotalAmount: number;
  totalBookings: number;
  totalCustomers: number;
}

export interface CarModel {
  carId: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  dailyRate: number;
  carImage: string;
  regNo: string;
}