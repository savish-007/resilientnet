
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
    getAllIncidents,
    getIncidentById,
    resolveIncident
} = require("../controllers/incidentController");

router.get("/", authenticate, getAllIncidents);

router.get("/:id", authenticate, getIncidentById);

router.patch("/:id/resolve", authenticate, requireAdmin, resolveIncident);

module.exports = router;
