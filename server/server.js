
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const sosRoutes = require("./routes/sosRoutes");
const http = require("http");
const { initializeSocket } = require("./sockets/socket");
const cors = require("cors");
const resourceRoutes = require("./routes/resourceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const resourceRequestRoutes = require("./routes/resourceRequestRoutes");

const app = express();
const server = http.createServer(app);
const PORT = 5000;

// CORS configuration
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

// Parse JSON requests with a 100 KB limit
app.use(express.json({ limit: "100kb" }));

// API routes
app.use("/api/sos", sosRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/resource-requests", resourceRequestRoutes);

// Handle unknown API endpoints
app.use("/api", (req, res) => {
    return res.status(404).json({
        message: "API endpoint not found."
    });
});

// Backend health check
app.get("/", (req, res) => {
    res.send("Welcome to ResilientNet Backend API");
});

// Centralized error-handling middleware
// Must be placed after the routes.
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    // Invalid JSON request
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        return res.status(400).json({
            message: "Invalid JSON request body."
        });
    }

    // Request body exceeds the configured limit
    if (err.type === "entity.too.large" || err.status === 413) {
        return res.status(413).json({
            message: "Request body exceeds the 100 KB limit."
        });
    }

    console.error("Unhandled API error:", err.message);

    const statusCode =
        Number.isInteger(err.status) &&
        err.status >= 400 &&
        err.status < 500
            ? err.status
            : 500;

    return res.status(statusCode).json({
        message:
            statusCode < 500
                ? "Invalid request."
                : "Internal Server Error"
    });
});

// Check database connectivity
pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database Connection Failed!");
        console.error(err.message);
    } else {
        console.log("Database Connected Successfully!");
        console.log("Current Database Time:", result.rows[0].now);
    }
});

// Initialize Socket.IO
initializeSocket(server);

// Start the backend server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
