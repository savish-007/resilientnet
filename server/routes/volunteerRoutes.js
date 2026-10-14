const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const {
    requireAdmin,
    requireAdminOrResponder
} = require("../middleware/adminMiddleware");

const {
    getAllVolunteers,
    assignVolunteer,
    getAssignedVolunteers,
    getMyAssignments,
    getMyVolunteerProfile,
    updateMyAvailability,
    updateVolunteerAvailability,
    updateVolunteerRole,
    getVolunteerRequests,
    approveVolunteerRequest,
    rejectVolunteerRequest
} = require("../controllers/volunteerController");

// List all active volunteers (accessible by Admin and Volunteer Responders)
router.get("/", authenticate, requireAdminOrResponder, getAllVolunteers);

// Admin-only: View pending volunteer requests
router.get("/requests", authenticate, requireAdmin, getVolunteerRequests);

// Self-service routes for logged-in volunteer
router.get("/me", authenticate, getMyVolunteerProfile);
router.get("/my-assignments", authenticate, getMyAssignments);
router.patch("/me/availability", authenticate, updateMyAvailability);

// Assign volunteers to incidents (Admin and Volunteer Responders)
router.post("/assign", authenticate, requireAdminOrResponder, assignVolunteer);
router.get(
    "/assigned/:incidentId",
    authenticate,
    requireAdminOrResponder,
    getAssignedVolunteers
);

// Admin-only: Volunteer management and approvals
router.patch("/:id/approve", authenticate, requireAdmin, approveVolunteerRequest);
router.delete("/:id/reject", authenticate, requireAdmin, rejectVolunteerRequest);
router.patch(
    "/:id/availability",
    authenticate,
    requireAdmin,
    updateVolunteerAvailability
);
router.patch("/:id/role", authenticate, requireAdmin, updateVolunteerRole);

module.exports = router;