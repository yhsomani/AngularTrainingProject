// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({ email, password: hashedPassword, name });

        res.json({ message: "User registered successfully", result: true });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during registration", result: false });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials", result: false });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials", result: false });

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "1h" }
        );

        // Note: The Angular login logic only checks for success, not the token. 
        // You'll need to update `login.ts` on the client to store this token.
        res.json({
            message: "Login successful",
            result: true,
            token,
            data: { id: user._id, email: user.email, name: user.name }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during login", result: false });
    }
};

// Logout is purely a client-side action (removing the token).
exports.logout = (req, res) => {
    res.json({ message: "Logout successful (client must delete token)", result: true });
};