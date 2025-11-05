// controllers/authController.js
const User = require("../models/User");
const Customer = require("../models/Customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---------------- Password & Email Validation Utilities (Security Hardening) ----------------
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\/]/.test(password);

    if (!password || password.length < minLength) {
        return { valid: false, message: `Password must be at least ${minLength} characters long.` };
    }
    if (!(hasUpper && hasLower)) {
        return { valid: false, message: "Password must contain both uppercase and lowercase letters." };
    }
    if (!hasDigit) {
        return { valid: false, message: "Password must include at least one number." };
    }
    if (!hasSpecial) {
        return { valid: false, message: "Password must include at least one special character." };
    }
    return { valid: true };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

exports.register = async (req, res) => {
    try {
        // FIX: Destructure new required fields: mobileNo and customerCity
        const { email, password, name, role, mobileNo, customerCity } = req.body;

        // 0. Basic input presence checks
        if (!email || !password || !name || !mobileNo || !customerCity) {
            return res.status(400).json({ message: "Missing required fields.", result: false });
        }

        // 0a. Email format validation (HIGH-1)
        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format.", result: false });
        }

        // 0b. Password strength validation (CRITICAL-2)
        const pwdCheck = validatePassword(password);
        if (!pwdCheck.valid) {
            return res.status(400).json({ message: pwdCheck.message, result: false });
        }

        // 1. Check if User account already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User account already exists with this email.", result: false });

        // 2. Check for Customer profile existence with the same email or mobileNo
        let customerExists = await Customer.findOne({ $or: [{ email: email }, { mobileNo: mobileNo }] });

        if (customerExists) {
            return res.status(400).json({ message: "A customer profile linked to this email or mobile number already exists.", result: false });
        }

        // 3. Create the User account
        const salt = await bcrypt.genSalt(12); // Increase cost factor slightly for stronger hashes
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            role: role || 'user'
        });

        // 4. Create the corresponding Customer record
        await Customer.create({
            _id: newUser._id, // Set Customer _id to match User _id for easy lookup
            customerName: name,
            customerCity: customerCity,
            mobileNo: mobileNo,
            email: email,
        });


        res.json({ message: "User registered successfully and customer profile created.", result: true });
    } catch (err) {
        // Handle unique index collision during customer creation (fallback)
        if (err.code === 11000) {
            return res.status(400).json({ message: "A profile with this email or mobile number already exists.", result: false });
        }
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

        // Ensure user ID is passed back as 'id' which matches Angular's UserDetails interface
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name, role: user.role }, // Include role in token
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
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

// NEW FUNCTION FOR PROFILE UPDATE (FEATURE #4)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.userId; // ID from JWT token
        const { name, email, mobileNo, customerCity, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found.", result: false });
        }

        // 1. Handle Password Change
        let newHashedPassword = user.password;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to change password.", result: false });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid current password.", result: false });
            }
            // Validate new password strength
            const newPwdCheck = validatePassword(newPassword);
            if (!newPwdCheck.valid) {
                return res.status(400).json({ message: newPwdCheck.message, result: false });
            }
            const salt = await bcrypt.genSalt(12);
            newHashedPassword = await bcrypt.hash(newPassword, salt);
        }

        // 2. Check for duplicate email/mobile for OTHER users/customers (RBAC Integrity Check)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Email is already in use by another user.", result: false });
            }
        }
        if (mobileNo) {
            // Mobile is stored in Customer, which also uses the user ID as its _id
            const existingCustomer = await Customer.findOne({ mobileNo, _id: { $ne: userId } });
            if (existingCustomer) {
                return res.status(400).json({ message: "Mobile number is already registered to another customer.", result: false });
            }
        }

        // 3. Update User Record
        const updatedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            email: email,
            password: newHashedPassword,
        }, { new: true, runValidators: true }).select('-password'); // Exclude password from response

        // 4. Update Customer Record (using the same ID)
        await Customer.findByIdAndUpdate(userId, {
            customerName: name,
            email: email,
            mobileNo: mobileNo,
            customerCity: customerCity,
        }, { new: true, runValidators: true });


        res.json({
            message: "Profile updated successfully.",
            result: true,
            // Return updated user details for the client to update localStorage/signals
            data: { id: updatedUser._id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role }
        });

    } catch (err) {
        res.status(500).json({ message: err.message || "Server error during profile update", result: false });
    }
};

exports.logout = (req, res) => {
    res.json({ message: "Logout successful (client must delete token)", result: true });
};