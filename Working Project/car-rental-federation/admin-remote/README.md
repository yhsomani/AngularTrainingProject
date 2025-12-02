# Admin Remote Module

This is a Module Federation remote application that provides administrative functionality for the Car Rental system.

## Features

- **Dashboard**: Overview of admin sections with quick actions
- **Cars Management**: Full CRUD operations for the vehicle fleet
- **Users Management**: Manage system administrators and staff
- **Bookings Management**: View and manage customer reservations

## Development

### Prerequisites

- Node.js 18+
- Angular CLI 20+
- Backend server running on port 4000

### Installation

```bash
npm install
```

### Running the Remote

```bash
npm start
```

The remote will be available at `http://localhost:3005`

### Module Federation

This remote exposes the `AdminComponent` which can be loaded by the host application:

```typescript
loadRemoteModule({
    type: 'module',
    remoteEntry: 'http://localhost:3005/remoteEntry.js',
    exposedModule: './Component'
}).then(m => m.AdminComponent)
```

## Architecture

```
src/app/
├── admin.component.ts          # Main admin panel with tabbed interface
├── admin.component.html        # Admin panel template
├── app.ts                      # Root app component
├── app.config.ts               # Application configuration
├── app.routes.ts               # Routing configuration
└── components/
    ├── cars-management/        # Fleet management component
    ├── users-management/       # System users management
    └── bookings-management/    # Booking reservations management
```

## API Endpoints

The admin panel consumes the following backend endpoints:

- `GET/POST/PUT/DELETE /api/cars` - Car management
- `GET/POST/PUT/DELETE /api/users` - User management  
- `GET/POST/PUT/DELETE /api/bookings` - Booking management
- `GET /api/customers` - Customer data (read-only)

## Styling

Uses Tailwind CSS with the shared configuration matching the host application's design system.
