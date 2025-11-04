// routes/carRentalRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const carController = require('../controllers/carController');
const customerController = require('../controllers/customerController');
const bookingController = require('../controllers/bookingController');

// New middleware for admin role check
const checkAdmin = (req, res, next) => {
    // req.user is set by the 'auth' middleware and contains the role
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        // Logged in, but unauthorized for this resource
        res.status(403).json({ message: 'Access denied: Admin role required.', result: false });
    }
};


// --- Public Routes (Handled by auth.js: /api/auth/register) ---

// --- JWT Protected Routes (Requires a valid token but NO specific role) ---
router.use(auth);

// Car (Vehicle) Routes - GetCars is open for all authenticated users to see vehicles for booking
router.get('/GetCars', carController.getAllCars);

// Booking Routes - geAllBookingsByCustomerId is open to all logged-in users to view their own bookings
router.get('/geAllBookingsByCustomerId', bookingController.getBookingsByCustomerId);
// Filter route is primarily for admin, but can be used by non-admin with specific filter parameters
router.post('/FilterBookings', bookingController.filterBookings);
router.get('/GetBookingByBookingId', bookingController.getBookingById);

// USER ACCESS - for basic booking (no discount, calculated total bill)
router.post('/CreateUserBooking', bookingController.createUserBooking);

// Profile Routes (New route for fetching customer profile details)
router.get('/GetCustomerProfileById', customerController.getCustomerProfileById);

// --- Admin Only Routes (Requires JWT AND Admin Role) ---

// Dashboard
router.get('/GetDashboardData', checkAdmin, bookingController.getDashboardData);

// Car (Vehicle) Routes (Management)
router.post('/CreateNewCar', checkAdmin, carController.createCar);
router.put('/UpdateCar', checkAdmin, carController.updateCar);
router.delete('/DeleteCarbyCarId', checkAdmin, carController.deleteCar);

// Customer Routes (Management)
router.get('/GetCustomers', checkAdmin, customerController.getCustomers);
router.post('/CreateNewCustomer', checkAdmin, customerController.createCustomer);
router.put('/UpdateCustomer', checkAdmin, customerController.updateCustomer);
// FIX: Corrected typo 'DeletCustomerById' to 'DeleteCustomerById'
router.delete('/DeleteCustomerById', checkAdmin, customerController.deleteCustomer);

// Booking Routes (Management)
router.get('/geAllBookings', checkAdmin, bookingController.getAllBookings);
router.post('/CreateNewBooking', checkAdmin, bookingController.createBooking); // ADMIN ONLY - for full control
router.delete('/DeletBookingById', checkAdmin, bookingController.deleteBooking); // ADMIN ONLY (Backend typo retained: DeletBookingById)

module.exports = router;