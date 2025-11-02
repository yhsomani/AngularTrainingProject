// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    // Internal references to other models
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

    // Denormalized fields to match the Angular Booking interface
    startDate: { type: String, required: true }, // UPDATED from bookingDate
    endDate: { type: String, required: true }, // NEW field
    discount: { type: Number, default: 0 },
    totalBillAmount: { type: Number, required: true },
    customerName: { type: String, required: true },
    mobileNo: { type: String, required: true },
    customerCity: { type: String, required: false },
    email: { type: String, required: false },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    bookingUid: { type: String, default: () => Math.random().toString(36).substring(2, 10) },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.bookingId = ret._id.toString();
            // Ensure internal ObjectIds are returned as strings to the client
            ret.carId = ret.carId.toString();

            delete ret._id;
            delete ret.__v;
            delete ret.updatedAt;
            delete ret.createdAt;
            // The client expects `carId` to be the ID of the car. We use the internal ObjectId here.
        }
    }
});

module.exports = mongoose.model('Booking', BookingSchema);