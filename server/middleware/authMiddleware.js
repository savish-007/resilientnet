
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access Denied. No valid token provided."
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate required JWT claims.
        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.id !== "string" ||
            !decoded.id.trim() ||
            typeof decoded.role !== "string" ||
            !decoded.role.trim()
        ) {
            return res.status(401).json({
                message: "Invalid token payload"
            });
        }

        // Confirm the account still exists and the token version is current.
        const result = await pool.query(
            "SELECT role, token_version FROM users WHERE id = $1",
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid Token"
            });
        }

        const user = result.rows[0];

        // Reject tokens issued before a password reset.
        if (
            !Number.isInteger(decoded.token_version) ||
            decoded.token_version !== user.token_version
        ) {
            return res.status(401).json({
                message: "Your session is no longer valid. Please log in again."
            });
        }

        // Reject tokens whose role no longer matches the database.
        if (decoded.role !== user.role) {
            return res.status(401).json({
                message: "Your session is no longer valid. Please log in again."
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        if (
            error.name !== "JsonWebTokenError" &&
            error.name !== "TokenExpiredError" &&
            error.name !== "NotBeforeError"
        ) {
            console.error("Authentication error:", error.message);

            return res.status(500).json({
                message: "Authentication service temporarily unavailable."
            });
        }

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticate;
