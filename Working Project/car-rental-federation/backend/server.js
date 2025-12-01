const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Load initial data
const dataPath = path.join(__dirname, 'data.json');
let db = {
    cars: [],
    bookings: [],
    customers: []
};

try {
    const rawData = fs.readFileSync(dataPath);
    db = JSON.parse(rawData);
    console.log(`Loaded ${db.cars.length} cars, ${db.bookings.length} bookings, ${db.customers.length} customers.`);
} catch (err) {
    console.error("Error loading data.json, starting with empty DB", err);
}

// Helper to save (optional: for this demo we'll keep in memory to be faster/safer)
const saveDb = () => {
    // fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
};

// --- ROUTES ---

// 1. CARS
app.get('/api/cars', (req, res) => {
    res.json(db.cars);
});

app.post('/api/car', (req, res) => {
    const newCar = req.body;
    newCar.carId = db.cars.length > 0 ? Math.max(...db.cars.map(c => c.carId)) + 1 : 1;
    db.cars.push(newCar);
    saveDb();
    res.json(newCar);
});

app.put('/api/car', (req, res) => {
    const updatedCar = req.body;
    const index = db.cars.findIndex(c => c.carId === updatedCar.carId);
    if (index !== -1) {
        db.cars[index] = updatedCar;
        saveDb();
        res.json(updatedCar);
    } else {
        res.status(404).json({ message: "Car not found" });
    }
});

app.delete('/api/car', (req, res) => {
    const id = parseInt(req.query.carId);
    db.cars = db.cars.filter(c => c.carId !== id);
    saveDb();
    res.json({ message: "Deleted successfully" });
});

// 2. CUSTOMERS
app.get('/api/customers', (req, res) => {
    res.json(db.customers);
});

app.post('/api/customer', (req, res) => {
    const newCust = req.body;
    newCust.customerId = db.customers.length > 0 ? Math.max(...db.customers.map(c => c.customerId)) + 1 : 1;
    db.customers.push(newCust);
    saveDb();
    res.json(newCust);
});

app.put('/api/customer', (req, res) => {
    const updatedCust = req.body;
    const index = db.customers.findIndex(c => c.customerId === updatedCust.customerId);
    if (index !== -1) {
        db.customers[index] = updatedCust;
        saveDb();
        res.json(updatedCust);
    } else {
        res.status(404).json({ message: "Customer not found" });
    }
});

app.delete('/api/customer', (req, res) => {
    const id = parseInt(req.query.customerId);
    db.customers = db.customers.filter(c => c.customerId !== id);
    saveDb();
    res.json({ message: "Deleted successfully" });
});

// 3. BOOKINGS
app.get('/api/bookings', (req, res) => {
    res.json(db.bookings);
});

app.post('/api/booking', (req, res) => {
    const newBooking = req.body;
    newBooking.bookingId = db.bookings.length > 0 ? Math.max(...db.bookings.map(b => b.bookingId)) + 1 : 1;

    // Generate fancy Booking UID
    const datePart = new Date().getFullYear();
    newBooking.bookingUid = `BK-${datePart}-${String(newBooking.bookingId).padStart(3, '0')}`;

    // Enrich with Customer/Car names for the UI list
    const customer = db.customers.find(c => c.customerId == newBooking.customerId);
    const car = db.cars.find(c => c.carId == newBooking.carId);

    if (customer) newBooking.customerName = customer.customerName;
    if (car) {
        newBooking.brand = car.brand;
        newBooking.model = car.model;

        // Calculate Amount Logic
        const rate = car.dailyRate || 1000;
        const discount = newBooking.discount || 0;
        newBooking.totalBillAmount = rate - (rate * (discount / 100));
    }

    db.bookings.push(newBooking);
    saveDb();
    res.json(newBooking);
});

app.put('/api/booking', (req, res) => {
    const updatedBooking = req.body;
    const index = db.bookings.findIndex(b => b.bookingId === updatedBooking.bookingId);
    if (index !== -1) {
        // Preserve original enrichments if not present in payload
        const original = db.bookings[index];
        db.bookings[index] = { ...original, ...updatedBooking };
        saveDb();
        res.json(db.bookings[index]);
    } else {
        res.status(404).json({ message: "Booking not found" });
    }
});

app.delete('/api/booking', (req, res) => {
    const id = parseInt(req.query.bookingId);
    db.bookings = db.bookings.filter(b => b.bookingId !== id);
    saveDb();
    res.json({ message: "Deleted successfully" });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
    console.log(`   - Cars: http://localhost:${PORT}/api/cars`);
    console.log(`   - Bookings: http://localhost:${PORT}/api/bookings`);
    console.log(`   - Customers: http://localhost:${PORT}/api/customers`);
});