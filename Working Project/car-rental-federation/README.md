# Car Rental Module Federation Application

## Overview
This is a Module Federation Angular application with a backend Express server for persistent data storage. The application consists of a host app and 5 remote micro-frontends, optimized for minimal backend API calls through efficient data aggregation, caching strategies, and performance enhancements. Calculations such as revenue are performed on the client side using fetched raw data. Recent updates include lazy loading of remotes, service worker caching, list virtualization, and RxJS optimizations to make the application faster and smoother.

## Architecture

### Applications
1. **Backend Server** (Port 3007) - Express.js server with REST APIs, designed for batched queries to minimize calls.
2. **Host App** (Port 3000) - Main shell application with shared services for data management, now featuring lazy-loaded remotes and service worker for offline caching.
3. **Dashboard Remote** (Port 3001) - Dashboard module with client-side calculated statistics and virtualized lists for large datasets.
4. **Vehicles Remote** (Port 3002) - Vehicles management with cached listings and debounced search for smoother interactions.
5. **Customers Remote** (Port 3003) - Customer management with efficient CRUD and pagination with infinite scroll.
6. **Bookings Remote** (Port 3004) - Booking management with aggregated data and pre-fetched dropdowns.
7. **Login Remote** (Port 3006) - Authentication module with optimized loading.

### Backend API Endpoints (Optimized for Minimal Calls)

#### Dashboard
- `GET /api/dashboard` - Get raw data for dashboard statistics (bookings, customers, vehicles) in a single aggregated response; calculations like revenue are handled client-side.

#### Customers
- `GET /api/customers` - Get all customers (supports pagination for large datasets).
- `POST /api/customers` - Create a new customer.
- `PUT /api/customers/:id` - Update a customer.
- `DELETE /api/customers/:id` - Delete a customer.

#### Bookings
- `GET /api/bookings` - Get all bookings (includes customer and car details to avoid extra calls; supports pagination).
- `GET /api/bookings/:id` - Get a booking by ID (with full details).
- `POST /api/bookings` - Create a new booking.
- `PUT /api/bookings/:id` - Update a booking.
- `DELETE /api/bookings/:id` - Delete a booking.

#### Cars
- `GET /api/cars` - Get all cars (supports pagination).
- `POST /api/cars` - Create a new car.
- `PUT /api/cars/:id` - Update a car.
- `DELETE /api/cars/:id` - Delete a car.

#### Aggregated Endpoints (New for Efficiency)
- `GET /api/aggregated-data` - Single endpoint to fetch combined raw data for dashboard, bookings, customers, and vehicles (e.g., lists with counts, avoiding multiple calls); client-side calculations applied.

## Quick Start

### Using the Startup Script
```bash
cd car-rental-federation
./start-all.sh
```

This will start all applications in the correct order with appropriate delays.

### Manual Startup
If you prefer to start applications manually:

1. **Start Backend Server**
```bash
cd backend
node server.js
```

2. **Start Dashboard Remote**
```bash
cd dashboard-remote
npm start
```

3. **Start Vehicles Remote**
```bash
cd vehicles-remote
npm start
```

4. **Start Customers Remote**
```bash
cd customers-remote
npm start
```

5. **Start Bookings Remote**
```bash
cd bookings-remote
npm start
```

6. **Start Login Remote**
```bash
cd login-remote
npm start
```

7. **Start Host App** (Start this last after all remotes are running)
```bash
cd host-app
npm start
```

## Access the Application

Once all applications are running, open your browser to:
- **Main Application**: http://localhost:3000

## Testing the Application

### Test Dashboard
Navigate to http://localhost:3000/dashboard
- View client-side calculated today's revenue, total bookings, customers, recent bookings, and top customers (from single API call with raw data). Lists are virtualized for smooth scrolling with large data.

### Test Vehicles
Navigate to http://localhost:3000/vehicles
- **Add Vehicle**: Fill the form and click "Add Vehicle".
- **Update Vehicle**: Click "Edit" on a vehicle, modify, and click "Update".
- **Delete Vehicle**: Click "Delete" on a vehicle and confirm.
- (Uses paginated GET for listings with debounced search to minimize load and improve responsiveness.)

### Test Customers
Navigate to http://localhost:3000/customers
- **Add Customer**: Fill the form and click "Add Customer".
- **Update Customer**: Click "Edit" on a customer, modify, and click "Update".
- **Delete Customer**: Click "Delete" on a customer and confirm.
- (Uses paginated GET with infinite scroll for seamless browsing.)

### Test Bookings
Navigate to http://localhost:3000/bookings
- **Add Booking**: Select customer and car (from cached dropdowns), set date and discount, click "Add Booking".
- **Update Booking**: Click "Edit" on a booking, modify, and click "Update".
- **Delete Booking**: Click "Delete" on a booking and confirm.
- (Bookings GET includes customer/car details to avoid extra calls; dropdowns are pre-fetched for faster loading.)

## Data Persistence and Optimization

All CRUD operations update the `backend/data.json` file directly. Data persists across restarts. To minimize calls and enhance speed:
- Use client-side caching (e.g., Angular Signals) for frequently accessed data like customer/car lists.
- Dashboard fetches raw data in one call, with calculations performed client-side.
- Implement pagination on GET endpoints to handle large datasets without overloading the backend.
- Added lazy loading for remote modules to reduce initial bundle size and improve load times.
- Service worker enabled for caching static assets and API responses, enabling offline functionality and faster subsequent loads.
- RxJS operators (e.g., debounce, switchMap) used for efficient data fetching and reduced unnecessary requests.
- List virtualization (e.g., via Angular CDK) for rendering large lists smoothly without performance drops.

## Proxy Configuration

The host app uses a proxy configuration to route API requests:
- Requests to `/api/*` from the Angular app are proxied to `http://localhost:3007/api/*`.
- This is configured in `host-app/proxy.conf.json`.

## Troubleshooting

### 404 Errors on PUT/DELETE
If you see 404 errors for PUT or DELETE operations:
1. Ensure the backend server is running on port 3007.
2. Check that the host app proxy is working: `curl http://localhost:3000/api/dashboard`.
3. Verify the backend directly: `curl http://localhost:3007/api/dashboard`.

### Remotes Not Loading
If remote modules don't load:
1. Ensure all remote apps are running and accessible.
2. Check browser console for CORS errors.
3. Verify remoteEntry.js files are accessible:
    - http://localhost:3001/remoteEntry.js
    - http://localhost:3002/remoteEntry.js
    - http://localhost:3003/remoteEntry.js
    - http://localhost:3004/remoteEntry.js
    - http://localhost:3006/remoteEntry.js

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:3003 | xargs kill -9
lsof -ti:3004 | xargs kill -9
lsof -ti:3006 | xargs kill -9
lsof -ti:3007 | xargs kill -9
```

## Development

### Building for Production
```bash
cd host-app
npm run build
```

### Running in Development Mode
All applications are configured for development mode with hot module replacement disabled for stability.

## Technologies Used

- **Frontend**: Angular 19, TypeScript
- **Module Federation**: @angular-architects/module-federation
- **Backend**: Node.js, Express.js
- **Styling**: Tailwind CSS with shared configuration
- **State Management**: Angular Signals (for caching and reactivity)
- **HTTP Client**: Angular HttpClient with RxJS (optimized for batched requests and debouncing)
- **Performance**: Lazy loading, service workers, list virtualization, and RxJS optimizations for faster, smoother user experience

## Tailwind CSS Configuration

### Shared Configuration (Critical for Module Federation)

This project uses a **shared Tailwind configuration** at the root level (`tailwind.config.cjs`) that includes content paths from ALL applications. This prevents CSS class purging issues in production builds.

**Why this is important:**
- Each remote app builds independently in Module Federation
- Tailwind purges unused CSS classes during build
- Without shared content paths, classes used in other apps get removed
- This causes broken UI in production when remotes load

**Configuration Structure:**
```
car-rental-federation/
├── tailwind.config.cjs      # Shared config with ALL app paths
├── tailwind.preset.cjs      # Shared theme, colors, animations
├── host-app/
│   └── tailwind.config.cjs  # References shared config
├── *-remote/
│   └── tailwind.config.cjs  # References shared config
```

**Shared Config Content:**
- Scans ALL source files across host + all remotes
- Ensures no CSS classes are accidentally purged
- Maintains consistent styling across federation

**NEVER modify individual app configs** - always update the shared config if needed.

## Project Structure

```
car-rental-federation/
├── backend/
│   ├── server.js          # Express server with optimized endpoints
│   └── data.json          # Persistent data storage
├── host-app/              # Main shell application
│   ├── proxy.conf.json    # API proxy configuration
│   └── src/
│       ├── app/
│       │   ├── services/
│       │   │   └── car-rental.service.ts  # Shared service with caching and RxJS optimizations
│       │   └── model/
│       │       └── api.types.ts  # Shared type definitions
├── dashboard-remote/      # Dashboard micro-frontend with virtualization
├── vehicles-remote/       # Vehicles micro-frontend with debounced search
├── customers-remote/      # Customers micro-frontend with infinite scroll
├── bookings-remote/       # Bookings micro-frontend with pre-fetched data
├── login-remote/          # Login micro-frontend
└── start-all.sh          # Startup script
```

## API Response Format

All API endpoints return responses in the format:
```json
{
  "success": true|false,
  "message": "Operation result message",
  "data": { ... }  // Optional data payload, aggregated where possible
}
```

## Notes

- Dashboard calculations (e.g., revenue) are performed on the client side using fetched raw data to minimize backend processing and calls.
- All dates are stored in ISO format (YYYY-MM-DD).
- Customer and car selections in bookings use cached dropdowns from shared service to avoid repeated fetches.
- The application uses Angular Signals for reactive state management and caching.
- All forms include validation and error handling.
- Lazy loading and service workers ensure faster initial loads and smoother interactions.
- To follow along all applications, refer to this structured README for consistent data flow and minimal API usage.
