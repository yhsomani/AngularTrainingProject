import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { LayoutComponent } from './layout.component';

// Helper to ensure type safety for Custom Event used in Login
declare const window: any;

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:3001/remoteEntry.js',
                        exposedModule: './Component'
                    }).then(m => m.DashboardComponent)
            },
            {
                path: 'vehicles',
                loadComponent: () =>
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:3002/remoteEntry.js',
                        exposedModule: './Component'
                    }).then(m => m.VehiclesComponent)
            },
            {
                path: 'customers',
                loadComponent: () =>
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:3003/remoteEntry.js',
                        exposedModule: './Component'
                    }).then(m => m.CustomersComponent)
            },
            {
                path: 'bookings',
                loadComponent: () =>
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:3004/remoteEntry.js',
                        exposedModule: './Component'
                    }).then(m => m.BookingsComponent)
            },
            {
                path: 'admin',
                loadComponent: () =>
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:3005/remoteEntry.js',
                        exposedModule: './Component'
                    }).then(m => m.AdminComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'login',
        loadComponent: () =>
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:3006/remoteEntry.js',
                exposedModule: './Component'
            }).then(m => m.LoginComponent)
    }
];