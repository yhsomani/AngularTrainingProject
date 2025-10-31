// models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerCity: { type: String, required: true },
    mobileNo: { type: String, required: true, unique: true },
    email: { type: String, required: false, unique: true, sparse: true }, // sparse allows multiple nulls
}, {
    toJSON: {
        transform: function (doc, ret) {
            ret.customerId = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('Customer', CustomerSchema);