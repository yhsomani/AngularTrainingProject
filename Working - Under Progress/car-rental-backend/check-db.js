const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/CarRentalDB')
    .then(async () => {
        console.log('Connected to MongoDB');

        const Customer = mongoose.model('Customer', new mongoose.Schema({
            customerName: String,
            email: String,
            mobileNo: String,
            customerCity: String
        }));

        const customers = await Customer.find({}).limit(10);
        console.log('\n=== Existing Customers ===');
        customers.forEach(c => {
            console.log(`Name: ${c.customerName}, Email: ${c.email}, Mobile: ${c.mobileNo}`);
        });

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String
        }));

        const users = await User.find({}).limit(10);
        console.log('\n=== Existing Users ===');
        users.forEach(u => {
            console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
        });

        mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
