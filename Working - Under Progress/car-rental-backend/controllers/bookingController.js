// controllers/bookingController.js
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Car = require('../models/Car');
const mongoose = require('mongoose'); // Added to check for valid ObjectIds

// Helper to check for date overlap for multi-day bookings (FEATURE #3)
function checkDateOverlap(newStart, newEnd, existingStart, existingEnd) {
    const newStartDate = new Date(newStart);
    const newEndDate = new Date(newEnd);
    const existingStartDate = new Date(existingStart);
    const existingEndDate = new Date(existingEnd);

    // Set time to midnight for accurate calculation on comparison
    newStartDate.setUTCHours(0, 0, 0, 0);
    newEndDate.setUTCHours(0, 0, 0, 0);
    existingStartDate.setUTCHours(0, 0, 0, 0);
    existingEndDate.setUTCHours(0, 0, 0, 0);

    // Overlap occurs if the new period starts before the existing period ends,
    // AND the new period ends after the existing period starts.
    return newStartDate <= existingEndDate && newEndDate >= existingStartDate;
}

// Helper to calculate duration in days (inclusive) (FEATURE #2)
function calculateDuration(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (start > end) return 0;

    // Set time to midnight for accurate calculation
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    // Convert to days (milliseconds per day) and add 1 day for inclusive count
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// GET /api/CarRentalApp/GetDashboardData (FEATURE #1: Complete Dashboard Data)
exports.getDashboardData = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().slice(0, 10);

        // 1. Total Bookings
        const totalBookings = await Booking.countDocuments();

        // 2. Total Customers
        const totalCustomers = await Customer.countDocuments();

        // 3. Today's Revenue (Bookings that start today)
        // Find bookings that START today (simplest interpretation for a dashboard metric)
        const todaysBookings = await Booking.find({ startDate: todayStr });
        const todayTotalAmount = todaysBookings.reduce((sum, b) => sum + b.totalBillAmount, 0);

        res.json({
            message: 'Success',
            result: true,
            data: {
                todayTotalAmount: todayTotalAmount,
                totalBookings: totalBookings,
                totalCustomers: totalCustomers,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// GET /api/CarRentalApp/geAllBookings
exports.getAllBookings = async (req, res) => {
    try {
        // Sort by start date, descending
        const bookings = await Booking.find().sort({ startDate: -1 });
        res.json({ message: 'Success', result: true, data: bookings });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// POST /api/CarRentalApp/FilterBookings
exports.filterBookings = async (req, res) => {
    try {
        const { mobileNo, customerName, carId, fromBookingDate, toBookingDate } = req.body;
        const query = {};

        if (mobileNo) query.mobileNo = new RegExp(mobileNo, 'i');
        if (customerName) query.customerName = new RegExp(customerName, 'i');

        if (carId && carId !== 0 && carId !== '0') {
            query.carId = carId;
        }

        // FIX: Update date filtering logic to check for booking overlap
        // A booking (B_start, B_end) overlaps with filter range (F_start, F_end) if:
        // 1. B_end >= F_start (Booking ends on or after filter start)
        // 2. B_start <= F_end (Booking starts on or before filter end)
        if (fromBookingDate) {
            query.endDate = { $gte: fromBookingDate };
        }

        if (toBookingDate) {
            // Check if query.startDate already exists, if not, create it as an empty object
            if (!query.startDate) {
                query.startDate = {};
            }
            query.startDate.$lte = toBookingDate; // Booking starts on or before filter end
        }

        const bookings = await Booking.find(query).sort({ startDate: -1 });
        res.json({ message: 'Success', result: true, data: bookings });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

/**
 * Common booking creation logic used by both admin and user paths. (FEATURE #2 & #3)
 */
async function processBookingCreation(req, res, isAdmin) {
    // UPDATED to accept startDate and endDate
    const { customerName, carId, startDate, endDate, discount, totalBillAmount, email, mobileNo } = req.body;

    // Basic date validation (FEATURE #2)
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        throw new Error('Invalid date range. Start Date must be before or equal to End Date.');
    }

    // 1. Robust Availability Check (FEATURE #3)
    const existingBookings = await Booking.find({ carId: carId });

    const overlapFound = existingBookings.some(b =>
        checkDateOverlap(startDate, endDate, b.startDate, b.endDate)
    );

    if (overlapFound) {
        throw new Error(`Car is already booked during the period ${startDate} to ${endDate}. Please select a different car or date range.`);
    }

    // 2. Determine Customer and Car details
    let customer = null;

    // Use the email for lookup, which is guaranteed to be unique and linked to a Customer
    if (email) {
        customer = await Customer.findOne({ email: email });
    } else if (isAdmin && customerName) {
        // Fallback for Admin to find by name, although email is safer
        customer = await Customer.findOne({ customerName: customerName });
    }

    const car = await Car.findById(carId);
    const duration = calculateDuration(startDate, endDate); // FEATURE #2: Calculate duration

    if (!customer) {
        throw new Error('Customer profile not found. Please ensure the customer name/email is correct.');
    }
    if (!car) {
        throw new Error('Invalid car ID provided.');
    }

    let finalDiscount = 0;
    let finalTotalBillAmount = 0;

    if (isAdmin) {
        // Admin path: Use the provided values
        if (totalBillAmount === undefined || totalBillAmount === null || totalBillAmount <= 0) {
            throw new Error('Admin must provide a valid Total Bill Amount (> 0).');
        }
        finalDiscount = discount || 0;
        finalTotalBillAmount = totalBillAmount;
    } else {
        // User path: Discount is always 0. Total Bill is calculated from car's daily rate and duration.
        finalDiscount = 0;
        finalTotalBillAmount = car.dailyRate * duration; // FEATURE #2: Calculation

        if (finalTotalBillAmount <= 0) {
            throw new Error('Calculated total bill is zero or less. Check car daily rate and duration.');
        }
    }

    // 3. Create Booking
    const newBooking = new Booking({
        // Set core identifiers using verified database results
        customerId: customer._id,
        carId: car._id,

        // Use the validated/enforced values (FEATURE #2)
        startDate: startDate,
        endDate: endDate,
        discount: finalDiscount,
        totalBillAmount: finalTotalBillAmount,

        // Denormalized fields sourced from the verified Customer and Car documents
        brand: car.brand,
        model: car.model,
        customerName: customer.customerName,
        mobileNo: customer.mobileNo,
        customerCity: customer.customerCity,
        email: customer.email,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json({
        message: 'Booking created successfully',
        result: true,
        data: savedBooking
    });
}

// POST /api/CarRentalApp/CreateNewBooking (Admin Route)
exports.createBooking = async (req, res) => {
    try {
        await processBookingCreation(req, res, true);
    } catch (err) {
        // Explicitly return the specific validation error message
        console.error('Admin Booking Error:', err.message, req.body);
        res.status(400).json({ message: err.message, result: false, data: null });
    }
};

// POST /api/CarRentalApp/CreateUserBooking (User Route)
exports.createUserBooking = async (req, res) => {
    try {
        await processBookingCreation(req, res, false);
    } catch (err) {
        // Explicitly return the specific validation error message
        console.error('User Booking Error:', err.message, req.body);
        res.status(400).json({ message: err.message, result: false, data: null });
    }
};


// GET /api/CarRentalApp/geAllBookingsByCustomerId?custId=...
exports.getBookingsByCustomerId = async (req, res) => {
    try {
        const custId = req.query.custId;
        // Sort by start date, descending
        const bookings = await Booking.find({ customerId: custId }).sort({ startDate: -1 });

        res.json({ message: 'Success', result: true, data: bookings });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// GET /api/CarRentalApp/GetBookingByBookingId?bookingId=...
exports.getBookingById = async (req, res) => {
    try {
        const bookingId = req.query.bookingId;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found', result: false, data: null });
        }

        res.json({ message: 'Success', result: true, data: booking });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// DELETE /api/CarRentalApp/DeletBookingById?id=...
exports.deleteBooking = async (req, res) => {
    try {
        const bookingId = req.query.id;
        const deletedBooking = await Booking.findByIdAndDelete(bookingId);

        if (!deletedBooking) {
            return res.status(404).json({ message: 'Booking not found', result: false, data: null });
        }

        res.json({ message: 'Booking deleted successfully', result: true, data: null });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};