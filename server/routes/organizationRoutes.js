const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
    getAllOrganizations
} = require("../controllers/organizationController");

router.get("/", authenticate, getAllOrganizations);

module.exports = router;