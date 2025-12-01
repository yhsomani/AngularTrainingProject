# Car Rental Backend

This is the backend server for the Car Rental application. It provides REST API endpoints to manage customers, bookings, cars, and dashboard data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3007`

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get a specific booking
- `POST /api/bookings` - Create a new booking
- `PUT /api/bookings/:id` - Update a booking
- `DELETE /api/bookings/:id` - Delete a booking

### Cars
- `GET /api/cars` - Get all cars
- `POST /api/cars` - Create a new car
- `PUT /api/cars/:id` - Update a car
- `DELETE /api/cars/:id` - Delete a car

## Data Storage

All data is stored in `data.json` file in the same directory. The server automatically updates this file when data is modified through the API endpoints.

## CORS

The server is configured with CORS enabled to allow requests from the Angular frontend applications.