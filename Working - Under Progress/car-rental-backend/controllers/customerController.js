// controllers/customerController.js
const Customer = require('../models/Customer');

// GET /api/CarRentalApp/GetCustomers
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json({ message: 'Success', result: true, data: customers });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// POST /api/CarRentalApp/CreateNewCustomer
exports.createCustomer = async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        const savedCustomer = await newCustomer.save();
        res.status(201).json({
            message: 'Customer created successfully',
            result: true,
            data: savedCustomer
        });
    } catch (err) {
        let message = err.code === 11000 ? 'Customer with this mobile/email already exists.' : err.message;
        res.status(400).json({ message, result: false, data: null });
    }
};

// PUT /api/CarRentalApp/UpdateCustomer
exports.updateCustomer = async (req, res) => {
    try {
        // Uses customerId from the client payload as the MongoDB _id string
        const updatedCustomer = await Customer.findByIdAndUpdate(req.body.customerId, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found', result: false, data: null });
        }

        res.json({
            message: 'Customer updated successfully',
            result: true,
            data: updatedCustomer
        });
    } catch (err) {
        let message = err.code === 11000 ? 'Customer update failed: duplicate contact info' : err.message;
        res.status(400).json({ message, result: false, data: null });
    }
};

// DELETE /api/CarRentalApp/DeletCustomerById?id=... (Matches client typo)
exports.deleteCustomer = async (req, res) => {
    try {
        const customerId = req.query.id; // ID is the MongoDB _id string
        const deletedCustomer = await Customer.findByIdAndDelete(customerId);

        if (!deletedCustomer) {
            return res.status(404).json({ message: 'Customer not found', result: false, data: null });
        }

        res.json({ message: 'Customer deleted successfully', result: true, data: null });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// NEW: GET /api/CarRentalApp/GetCustomerProfileById?userId=...
exports.getCustomerProfileById = async (req, res) => {
    try {
        // Since Customer._id matches User._id, we can search by the user ID
        const userId = req.query.userId;
        const customer = await Customer.findById(userId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer profile not found', result: false, data: null });
        }

        res.json({ message: 'Success', result: true, data: customer });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};