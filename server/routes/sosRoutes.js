const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const authenticate = require("../middleware/authMiddleware");

const {
    createSOS,
    batchMeshSync,
    getMeshStats,
    getAllSOS,
    getDashboardStats
} = require("../controllers/sosController");

// Optional authentication for mesh gateway relays
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch {
            req.user = null;
        }
    }
    next();
};

// Standard authenticated endpoints
router.get("/", authenticate, getAllSOS);
router.get("/stats", authenticate, getDashboardStats);
router.get("/mesh-stats", authenticate, getMeshStats);
router.post("/", authenticate, createSOS);

// Mobile Mesh Gateway Relay Endpoints
router.post("/mesh-relay", optionalAuth, createSOS);
router.post("/mesh-sync", optionalAuth, batchMeshSync);

module.exports = router;