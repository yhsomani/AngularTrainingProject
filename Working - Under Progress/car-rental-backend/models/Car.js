// models/Car.js
const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true, min: 1900 },
    color: { type: String, required: true },
    dailyRate: { type: Number, required: true, min: 0 },
    carImage: { type: String, default: '' },
    regNo: { type: String, required: true, unique: true },
}, {
    toJSON: {
        transform: function (doc, ret) {
            // Maps MongoDB _id (string) to the expected client field name
            ret.carId = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('Car', CarSchema);