// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Import Routes
const authRoutes = require('./routes/auth');
const carRentalRoutes = require('./routes/carRentalRoutes');

// --- Configuration ---
const app = express();
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CarRentalDB';
const PORT = process.env.PORT || 5000;

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Simple endpoint to test the server
app.get('/', (req, res) => {
    res.send('Car Rental Backend API is running...');
});

// --- API Routes ---
// Auth routes (Login/Register)
app.use('/api/auth', authRoutes); // API GATEWAY: /api/auth/...

// Main Car Rental Data API routes, matching the Angular proxy path prefix
app.use('/api/CarRentalApp', carRentalRoutes); // API GATEWAY: /api/CarRentalApp/...

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});