// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        // Now expecting name, email, password, and optionally role
        const { email, password, name, role } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Assign the role if provided, otherwise use the default defined in the User model ('admin')
        // NOTE: Since the frontend now sends 'admin' or 'user', we pass it directly.
        user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: role || 'user' // Use provided role or default to 'user' if client omits it.
        });

        res.json({ message: "User registered successfully. You can now log in.", result: true });
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

        res.json({
            message: "Login successful",
            result: true,
            token,
            data: { id: user._id, email: user.email, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during login", result: false });
    }
};

exports.logout = (req, res) => {
    res.json({ message: "Logout successful (client must delete token)", result: true });
};