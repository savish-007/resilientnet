const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
    getAllResourceRequests,
    getResourceRequestById,
    createResourceRequest,
    updateResourceRequest
} = require("../controllers/resourceRequestController");

router.get("/", authenticate, getAllResourceRequests);

router.get("/:id", authenticate, getResourceRequestById);

router.post("/", authenticate, createResourceRequest);

router.put("/:id", authenticate, updateResourceRequest);

module.exports = router;