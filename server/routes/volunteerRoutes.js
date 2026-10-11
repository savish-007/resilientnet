
const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
    getAllVolunteers,
    assignVolunteer,
    getAssignedVolunteers,
    getMyAssignments,
    getMyVolunteerProfile,
    updateMyAvailability,
    updateVolunteerAvailability
} = require("../controllers/volunteerController");


router.get("/", authenticate, requireAdmin, getAllVolunteers);

// Self-service routes — keep these before /:id routes
router.get("/me", authenticate, getMyVolunteerProfile);
router.get("/my-assignments", authenticate, getMyAssignments);
router.patch(
    "/me/availability",
    authenticate,
    updateMyAvailability
);

// Existing assignment routes
router.post("/assign", authenticate, requireAdmin, assignVolunteer);
router.get(
    "/assigned/:incidentId",
    authenticate,
    requireAdmin,
    getAssignedVolunteers
);

// Existing admin-only availability route
router.patch(
    "/:id/availability",
    authenticate,
    requireAdmin,
    updateVolunteerAvailability
);


module.exports = router;
