// routes/carRentalRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const carController = require('../controllers/carController');
const customerController = require('../controllers/customerController');
const bookingController = require('../controllers/bookingController');

// --- Public Routes (Customer Registration is public) ---
// This route is now public and does NOT require a JWT token
router.post('/CreateNewCustomer', customerController.createCustomer);

// --- Protect all other data routes with JWT authentication ---
router.use(auth);

// --- Dashboard Routes ---
router.get('/GetDashboardData', bookingController.getDashboardData);

// --- Car (Vehicle) Routes ---
router.get('/GetCars', carController.getAllCars);
router.post('/CreateNewCar', carController.createCar);
router.put('/UpdateCar', carController.updateCar);
router.delete('/DeleteCarbyCarId', carController.deleteCar);

// --- Customer Routes ---
router.get('/GetCustomers', customerController.getCustomers);
// The POST route is moved above router.use(auth)
router.put('/UpdateCustomer', customerController.updateCustomer);
router.delete('/DeletCustomerById', customerController.deleteCustomer); // Matches client typo

// --- Booking Routes ---
router.get('/geAllBookings', bookingController.getAllBookings); // Matches client typo
router.post('/FilterBookings', bookingController.filterBookings);
router.get('/geAllBookingsByCustomerId', bookingController.getBookingsByCustomerId); // Matches client typo
router.get('/GetBookingByBookingId', bookingController.getBookingById);
router.post('/CreateNewBooking', bookingController.createBooking);
router.delete('/DeletBookingById', bookingController.deleteBooking); // Matches client typo

module.exports = router;