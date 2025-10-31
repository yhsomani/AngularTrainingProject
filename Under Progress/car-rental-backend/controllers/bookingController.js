// controllers/bookingController.js
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

// Helper to format date as yyyy-mm-dd
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
};


// GET /api/CarRentalApp/GetDashboardData
exports.getDashboardData = async (req, res) => {
    try {
        const todayStr = formatDate(new Date());

        const bookings = await Booking.find({ bookingDate: todayStr });
        const todayTotalAmount = bookings.reduce((sum, b) => sum + b.totalBillAmount, 0);

        // This structure is simplified to match what the Angular service expects from this specific API call
        res.json({
            message: 'Success',
            result: true,
            data: { todayTotalAmount: todayTotalAmount }
        });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// GET /api/CarRentalApp/geAllBookings (Matches client typo)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ bookingDate: -1 });
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
        // carId from the client is the Car ObjectId string
        if (carId && carId !== 0) query.carId = carId;

        if (fromBookingDate || toBookingDate) {
            query.bookingDate = {};
            if (fromBookingDate) query.bookingDate.$gte = fromBookingDate;
            if (toBookingDate) query.bookingDate.$lte = toBookingDate;
        }

        const bookings = await Booking.find(query).sort({ bookingDate: -1 });
        res.json({ message: 'Success', result: true, data: bookings });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// POST /api/CarRentalApp/CreateNewBooking
exports.createBooking = async (req, res) => {
    try {
        const { customerName, carId } = req.body;

        const customer = await Customer.findOne({ customerName: customerName });

        if (!customer) {
            return res.status(400).json({ message: 'Invalid customer name provided.', result: false, data: null });
        }

        const newBooking = new Booking({
            ...req.body,
            customerId: customer._id, // Set internal customer ID
            carId: carId,             // Use the Car ObjectId string
        });

        const savedBooking = await newBooking.save();
        res.status(201).json({
            message: 'Booking created successfully',
            result: true,
            data: savedBooking
        });
    } catch (err) {
        res.status(400).json({ message: err.message, result: false, data: null });
    }
};

// GET /api/CarRentalApp/geAllBookingsByCustomerId?custId=... (Matches client typo)
exports.getBookingsByCustomerId = async (req, res) => {
    try {
        const custId = req.query.custId; // Customer ID (Mongoose ObjectId string)
        const bookings = await Booking.find({ customerId: custId }).sort({ bookingDate: -1 });

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

// DELETE /api/CarRentalApp/DeletBookingById?id=... (Matches client typo)
exports.deleteBooking = async (req, res) => {
    try {
        const bookingId = req.query.id; // ID is the MongoDB _id string
        const deletedBooking = await Booking.findByIdAndDelete(bookingId);

        if (!deletedBooking) {
            return res.status(404).json({ message: 'Booking not found', result: false, data: null });
        }

        res.json({ message: 'Booking deleted successfully', result: true, data: null });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};