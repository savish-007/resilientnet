
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
    register,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many password-reset attempts. Please try again after 15 minutes."
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many registration attempts. Please try again after 15 minutes."
    }
});



router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

// Limit repeated password-reset attempts.
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

module.exports = router;
