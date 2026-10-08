const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
    getAllIncidents,
    getIncidentById
} = require("../controllers/incidentController");

router.get("/", authenticate, getAllIncidents);

router.get("/:id", authenticate, getIncidentById);

module.exports = router;
