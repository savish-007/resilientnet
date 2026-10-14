
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
const organizationRoutes = require("./routes/organizationRoutes");

const app = express();
const server = http.createServer(app);
const PORT = 5000;

// CORS configuration

const allowedOrigins = (
    process.env.FRONTEND_URL ||
    "http://localhost:5173,http://localhost:5174,http://localhost:4175"
)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header, such as
            // server-to-server requests and local health checks.
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = origin.replace(/\/$/, "");

            if (allowedOrigins.includes(normalizedOrigin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
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
app.use("/api/organizations", organizationRoutes);

// Handle unknown API endpoints
app.use("/api", (req, res) => {
    return res.status(404).json({
        message: "API endpoint not found."
    });
});

// Direct APK Download
const path = require("path");
app.get(["/download-apk", "/ResilientNet.apk"], (req, res) => {
    const apkPath = path.resolve(__dirname, "../ResilientNet.apk");
    res.download(apkPath, "ResilientNet.apk", (err) => {
        if (err && !res.headersSent) {
            console.error("APK download error:", err.message);
            res.status(404).send("APK file not found on server.");
        }
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
