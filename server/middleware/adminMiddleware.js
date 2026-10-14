const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access denied. Admin privileges required."
        });
    }

    next();
};

const requireAdminOrResponder = (req, res, next) => {
    if (
        !req.user ||
        !["ADMIN", "VOLUNTEER_RESPONDER"].includes(req.user.role)
    ) {
        return res.status(403).json({
            message:
                "Access denied. Administrator or Volunteer Responder privileges required."
        });
    }

    next();
};

requireAdmin.requireAdmin = requireAdmin;
requireAdmin.requireAdminOrResponder = requireAdminOrResponder;

module.exports = requireAdmin;