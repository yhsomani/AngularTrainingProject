// controllers/carController.js
const Car = require('../models/Car');

// GET /api/CarRentalApp/GetCars
exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.json({ message: 'Success', result: true, data: cars });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};

// POST /api/CarRentalApp/CreateNewCar
exports.createCar = async (req, res) => {
    try {
        const newCar = new Car(req.body);
        const savedCar = await newCar.save();
        res.status(201).json({
            message: 'Vehicle created successfully',
            result: true,
            data: savedCar
        });
    } catch (err) {
        let message = err.code === 11000 && err.keyPattern.regNo ? 'Car Registration No Already Exist' : err.message;
        res.status(400).json({ message, result: false, data: null });
    }
};

// PUT /api/CarRentalApp/UpdateCar
exports.updateCar = async (req, res) => {
    try {
        // Uses carId from the client payload as the MongoDB _id string
        const updatedCar = await Car.findByIdAndUpdate(req.body.carId, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedCar) {
            return res.status(404).json({ message: 'Vehicle not found', result: false, data: null });
        }

        res.json({ message: 'Vehicle updated successfully', result: true, data: updatedCar });
    } catch (err) {
        let message = err.code === 11000 && err.keyPattern.regNo ? 'Car Registration No Already Exist' : err.message;
        res.status(400).json({ message, result: false, data: null });
    }
};

// DELETE /api/CarRentalApp/DeleteCarbyCarId?carId=...
exports.deleteCar = async (req, res) => {
    try {
        const carId = req.query.carId; // CarId is the MongoDB _id string
        const deletedCar = await Car.findByIdAndDelete(carId);

        if (!deletedCar) {
            return res.status(404).json({ message: 'Vehicle not found', result: false, data: null });
        }

        res.json({ message: 'Vehicle deleted successfully', result: true, data: null });
    } catch (err) {
        res.status(500).json({ message: err.message, result: false, data: null });
    }
};