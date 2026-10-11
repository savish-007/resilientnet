
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/email");



const register = async (req, res) => {
    const {
        full_name,
        email,
        password,
        phone,
        organization
    } = req.body || {};

    // Validate required fields.
    if (
        typeof full_name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof phone !== "string" ||
        !full_name.trim() ||
        !email.trim() ||
        !password ||
        !phone.trim()
    ) {
        return res.status(400).json({
            message: "Full name, email, password, and phone are required."
        });
    }

    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Validate field lengths.
    if (
        normalizedName.length > 100 ||
        normalizedEmail.length > 254 ||
        normalizedPhone.length > 20 ||
        password.length < 8 ||
        password.length > 128
    ) {
        return res.status(400).json({
            message: "Please check your input lengths. Password must be 8–128 characters."
        });
    }

    // Basic email format validation.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            message: "Please provide a valid email address."
        });
    }

    const role = "VOLUNTEER";
    let client;

    try {
        // Acquire the database connection inside the try block.
        client = await pool.connect();

        await client.query("BEGIN");

        const existingUser = await client.query(
            "SELECT id FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await client.query(
            `INSERT INTO users
             (full_name, email, password_hash, phone, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                normalizedName,
                normalizedEmail,
                hashedPassword,
                normalizedPhone,
                role
            ]
        );

        const userId = userResult.rows[0].id;

        await client.query(
            `INSERT INTO volunteers (user_id)
             VALUES ($1)`,
            [userId]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Volunteer Registered Successfully"
        });

    } catch (error) {
        // Roll back only if a transaction was started.
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Registration rollback failed:",
                    rollbackError.message
                );
            }
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Server Error"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};


const login = async (req, res) => {
    const { email, password } = req.body || {};

    // Validate required fields and their types.
    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password ||
        email.length > 254 ||
        password.length > 128
    ) {
        return res.status(400).json({
            message: "Please provide a valid email and password."
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            "SELECT * FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        // Use the same response for an unknown email and wrong password.
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                token_version: user.token_version
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );

        return res.json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};


const forgotPassword = async (req, res) => {
    const email =
    req.body && typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const genericMessage =
        "If an account exists for this email, a password-reset link will be sent.";

    if (!email) {
        return res.status(200).json({
            message: genericMessage
        });
    }

    try {
        const result = await pool.query(
            "SELECT id, email FROM users WHERE LOWER(email) = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                message: genericMessage
            });
        }

        const user = result.rows[0];

        const resetToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Invalidate previous unused reset links.
        await pool.query(
            `UPDATE password_reset_tokens
             SET used_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND used_at IS NULL`,
            [user.id]
        );

        // Create a reset token that expires in 15 minutes.
        const tokenResult = await pool.query(
            `INSERT INTO password_reset_tokens
             (user_id, token_hash, expires_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '15 minutes')
             RETURNING id`,
            [user.id, tokenHash]
        );

        const resetLink =
            `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Reset your ResilientNet password",
                text: `We received a request to reset your ResilientNet password.

Open this link within 15 minutes to choose a new password:
${resetLink}

If you did not request this, you can ignore this email.`,
                html: `
                    <h2>Reset your ResilientNet password</h2>
                    <p>We received a request to reset your password.</p>
                    <p><a href="${resetLink}">Reset my password</a></p>
                    <p>This link expires in 15 minutes and can only be used once.</p>
                    <p>If you did not request this, you can ignore this email.</p>
                `
            });

        } catch (emailError) {
            console.error(
                "Password-reset email delivery failed:",
                emailError.message
            );

            // Prevent the undelivered link from being used.
            await pool.query(
                `UPDATE password_reset_tokens
                 SET used_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND used_at IS NULL`,
                [tokenResult.rows[0].id]
            );

            return res.status(200).json({
                message: genericMessage
            });
        }

        return res.status(200).json({
            message: genericMessage
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            message: "Unable to process your request right now. Please try again later."
        });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (
    typeof token !== "string" ||
    token.length !== 64 ||
    !/^[a-f0-9]{64}$/.test(token) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
) {
        return res.status(400).json({
            message: "A valid reset token and a password of 8–128 characters are required."
        });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    let client;

try {
    client = await pool.connect();

    await client.query("BEGIN");

        // Lock the token row so simultaneous requests cannot reuse it.
        const tokenResult = await client.query(
            `SELECT id, user_id
             FROM password_reset_tokens
             WHERE token_hash = $1
               AND used_at IS NULL
               AND expires_at > CURRENT_TIMESTAMP
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This reset link is invalid, expired, or already used."
            });
        }

        const resetRecord = tokenResult.rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query(
            `UPDATE users
             SET password_hash = $1,
                 token_version = token_version + 1
             WHERE id = $2`,
            [hashedPassword, resetRecord.user_id]
        );

        await client.query(
            `UPDATE password_reset_tokens
             SET used_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND used_at IS NULL`,
            [resetRecord.user_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Password reset successfully. You can now log in with your new password."
        });

    } catch (error) {
    if (client) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Password-reset rollback failed:",
                rollbackError.message
            );
        }
    }

    console.error("Reset password error:", error.message);

    return res.status(500).json({
        message: "Unable to reset your password right now. Please try again later."
    });
} finally {
    if (client) {
        client.release();
    }
}
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
