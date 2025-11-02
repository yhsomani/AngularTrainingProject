// models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    // NOTE: The _id of this document is set to match the corresponding User's _id during registration
    // This allows us to find the Customer profile easily from the logged-in User's token (req.user.userId)
    customerName: { type: String, required: true },
    customerCity: { type: String, required: true },
    mobileNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Changed to required: true, unique: true as it's the link to User
}, {
    // Disable automatic _id generation since we set it manually in authController
    _id: false,
    toJSON: {
        transform: function (doc, ret) {
            // MongoDB documents use _id, but since we set _id manually, it remains.
            // When using .find() on this model, the _id is implicitly returned.
            // We set the alias for the frontend here.
            ret.customerId = ret._id ? ret._id.toString() : null;
            delete ret.__v;
        }
    }
});

// Since we are setting the _id manually, the schema needs to reflect that the document
// will always have a unique _id (which is inherited from the User document).
module.exports = mongoose.model('Customer', CustomerSchema);
