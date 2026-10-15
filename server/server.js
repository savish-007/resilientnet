
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
const PORT = process.env.PORT || 5000;

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
            // Mobile native apps (Capacitor), Postman, and curl may not send an Origin header
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = origin.replace(/\/$/, "");

            // Allow configured origins, Capacitor origins, localhost on any port, and LAN IPs
            if (
                allowedOrigins.includes(normalizedOrigin) ||
                normalizedOrigin === "http://localhost" ||
                normalizedOrigin === "https://localhost" ||
                normalizedOrigin === "capacitor://localhost" ||
                normalizedOrigin.startsWith("http://192.168.") ||
                normalizedOrigin.startsWith("https://192.168.") ||
                normalizedOrigin.startsWith("http://10.") ||
                normalizedOrigin.startsWith("http://172.") ||
                normalizedOrigin.includes("localhost:") ||
                normalizedOrigin.includes("127.0.0.1:")
            ) {
                return callback(null, true);
            }

            // Fallback allow for development / mobile testing
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

// Serve static frontend assets from client/dist (for direct web access)
const distPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(distPath));

// API health endpoint
app.get("/api-health", (req, res) => {
    res.json({ status: "ok", message: "ResilientNet Backend API is running." });
});

// Fallback to client-side index.html for web navigation
app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/download-apk" || req.path === "/ResilientNet.apk") {
        return next();
    }
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
            res.send("Welcome to ResilientNet Backend API");
        }
    });
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
