import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches JWT token from localStorage to API requests.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('authToken');

    // Only attach the token if it exists and the request URL starts with '/api/'
    if (token && req.url.includes('/api/')) {
        const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(cloned);
    }

    return next(req);
};