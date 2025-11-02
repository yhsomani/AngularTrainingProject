// routes/auth.js
const express = require('express');
const { register, login, logout, updateUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.put('/update', auth, updateUser); // NEW ROUTE for Profile Update

module.exports = router;