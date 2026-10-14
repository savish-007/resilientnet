const pool = require("../config/db");
const { getIO } = require("../sockets/socket");
const { performAIAnalysis } = require("./aiController");
const { randomUUID } = require("crypto");

// -------------------------------------------------------------
// GET SYSTEM ADMIN USER ID (Fallback for unauthenticated mesh gateways)
// -------------------------------------------------------------
const getSystemUserId = async () => {
    try {
        const adminUser = await pool.query(
            "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
        );
        return adminUser.rows[0]?.id || "d3e4527b-d2cf-4c5c-9d42-108d406006d1";
    } catch {
        return "d3e4527b-d2cf-4c5c-9d42-108d406006d1";
    }
};

// -------------------------------------------------------------
// GET DASHBOARD STATS DATA
// -------------------------------------------------------------
const getDashboardStatsData = async () => {
    const activeSOS = await pool.query(
        "SELECT COUNT(*) FROM sos_reports WHERE status = 'NEW'"
    );

    const volunteers = await pool.query(
        "SELECT COUNT(*) FROM volunteers"
    );

    const resources = await pool.query(
        "SELECT COUNT(*) FROM resources"
    );

    const highPriority = await pool.query(
        "SELECT COUNT(*) FROM sos_reports WHERE severity = 'HIGH'"
    );

    return {
        activeSOS: Number(activeSOS.rows[0].count),
        volunteers: Number(volunteers.rows[0].count),
        resources: Number(resources.rows[0].count),
        highPriority: Number(highPriority.rows[0].count)
    };
};

// -------------------------------------------------------------
// CREATE SOS (With Mesh Deduplication)
// -------------------------------------------------------------
const createSOS = async (req, res) => {
    const {
        message,
        category,
        severity,
        latitude,
        longitude,
        mesh_message_id,
        hops
    } = req.body;

    if (
        typeof message !== "string" ||
        !message.trim() ||
        typeof category !== "string" ||
        !category.trim() ||
        !["LOW", "MEDIUM", "HIGH"].includes(severity) ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude)) ||
        Number(latitude) < -90 ||
        Number(latitude) > 90 ||
        Number(longitude) < -180 ||
        Number(longitude) > 180
    ) {
        return res.status(400).json({
            message: "Valid message, category, severity, latitude and longitude are required"
        });
    }

    // 1. MESH DEDUPLICATION CHECK
    if (mesh_message_id && typeof mesh_message_id === "string") {
        try {
            const existing = await pool.query(
                "SELECT id, incident_id FROM sos_reports WHERE mesh_message_id = $1",
                [mesh_message_id.trim()]
            );

            if (existing.rows.length > 0) {
                return res.status(200).json({
                    status: "DUPLICATE_IGNORED",
                    message: "Mesh SOS report already ingested by emergency response center",
                    sos_id: existing.rows[0].id,
                    incident_id: existing.rows[0].incident_id,
                    mesh_message_id: mesh_message_id.trim()
                });
            }
        } catch (err) {
            console.error("Deduplication check error:", err.message);
        }
    }

    const client = await pool.connect();
    let incident;
    let newSOS;

    const creatorId = req.user?.id || (await getSystemUserId());

    try {
        await client.query("BEGIN");

        const incidentNumber =
            `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

        const incidentTitle = mesh_message_id
            ? `[Mesh ${hops ? hops + " hops" : "Relay"}] ${message.trim().slice(0, 180)}`
            : message.trim().slice(0, 200);

        const incidentResult = await client.query(
            `INSERT INTO incidents
                (incident_number, title, description, category, severity,
                 status, report_count, created_by, location)
             VALUES
                ($1, $2, $3, $4, $5, 'NEW', 1, $6,
                 ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
             RETURNING *`,
            [
                incidentNumber,
                incidentTitle,
                message.trim(),
                category.trim(),
                severity,
                creatorId,
                Number(longitude),
                Number(latitude)
            ]
        );

        incident = incidentResult.rows[0];

        const sosResult = await client.query(
            `INSERT INTO sos_reports
                (sender_id, message, category, severity, status,
                 location, mesh_message_id, incident_id)
             VALUES
                ($1, $2, $3, $4, 'NEW',
                 ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
                 $7, $8)
             RETURNING *`,
            [
                req.user?.id || null,
                message.trim(),
                category.trim(),
                severity,
                Number(longitude),
                Number(latitude),
                mesh_message_id ? mesh_message_id.trim() : null,
                incident.id
            ]
        );

        newSOS = sosResult.rows[0];

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("SOS creation failed:", error);

        return res.status(500).json({
            message: "Failed to create SOS report"
        });
    } finally {
        client.release();
    }

    // AI analysis
    try {
        await performAIAnalysis(incident.id);
    } catch (error) {
        console.error("SOS AI analysis failed:", error);
    }

    // Realtime Socket.IO Broadcast
    try {
        const io = getIO();
        let senderName = "Emergency Mesh Relay";

        if (req.user?.id) {
            const sender = await pool.query(
                "SELECT full_name FROM users WHERE id = $1",
                [req.user.id]
            );
            senderName = sender.rows[0]?.full_name || "Direct Responder";
        }

        io.emit("newSOS", {
            ...newSOS,
            sender_name: senderName,
            is_mesh_relay: Boolean(mesh_message_id)
        });

        const updatedStats = await getDashboardStatsData();
        io.emit("dashboardStats", updatedStats);
    } catch (error) {
        console.error("SOS notification failed:", error);
    }

    return res.status(201).json({
        message: "SOS Report Created Successfully",
        status: "INGESTED",
        incident,
        sos: newSOS
    });
};

// -------------------------------------------------------------
// BATCH MESH SYNC (When phone reconnects to internet)
// -------------------------------------------------------------
const batchMeshSync = async (req, res) => {
    const { packets } = req.body;

    if (!Array.isArray(packets) || packets.length === 0) {
        return res.status(400).json({
            message: "An array of mesh packets is required in 'packets'"
        });
    }

    const client = await pool.connect();
    const results = [];
    let ingestedCount = 0;
    let duplicateCount = 0;

    const creatorId = req.user?.id || (await getSystemUserId());

    for (const packet of packets) {
        const {
            message,
            category,
            severity,
            latitude,
            longitude,
            mesh_message_id,
            hops
        } = packet;

        // Validation
        if (
            !message ||
            !category ||
            !["LOW", "MEDIUM", "HIGH"].includes(severity) ||
            !Number.isFinite(Number(latitude)) ||
            !Number.isFinite(Number(longitude))
        ) {
            results.push({
                mesh_message_id: mesh_message_id || null,
                status: "REJECTED",
                reason: "Invalid coordinates or missing required fields"
            });
            continue;
        }

        // Deduplication Check
        if (mesh_message_id) {
            const existing = await client.query(
                "SELECT id, incident_id FROM sos_reports WHERE mesh_message_id = $1",
                [String(mesh_message_id).trim()]
            );

            if (existing.rows.length > 0) {
                duplicateCount++;
                results.push({
                    mesh_message_id,
                    status: "DUPLICATE_IGNORED",
                    incident_id: existing.rows[0].incident_id
                });
                continue;
            }
        }

        // Ingest packet atomically
        try {
            await client.query("BEGIN");

            const incidentNumber = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

            const incidentTitle = `[Mesh ${hops ? hops + " hops" : "Relay"}] ${String(message).trim().slice(0, 180)}`;

            const incidentResult = await client.query(
                `INSERT INTO incidents
                    (incident_number, title, description, category, severity,
                     status, report_count, created_by, location)
                 VALUES
                    ($1, $2, $3, $4, $5, 'NEW', 1, $6,
                     ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
                 RETURNING *`,
                [
                    incidentNumber,
                    incidentTitle,
                    String(message).trim(),
                    String(category).trim(),
                    severity,
                    creatorId,
                    Number(longitude),
                    Number(latitude)
                ]
            );

            const incident = incidentResult.rows[0];

            const sosResult = await client.query(
                `INSERT INTO sos_reports
                    (sender_id, message, category, severity, status,
                     location, mesh_message_id, incident_id)
                 VALUES
                    ($1, $2, $3, $4, 'NEW',
                     ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
                     $7, $8)
                 RETURNING *`,
                [
                    req.user?.id || null,
                    String(message).trim(),
                    String(category).trim(),
                    severity,
                    Number(longitude),
                    Number(latitude),
                    mesh_message_id ? String(mesh_message_id).trim() : null,
                    incident.id
                ]
            );

            await client.query("COMMIT");
            ingestedCount++;

            // Run AI analysis
            try {
                await performAIAnalysis(incident.id);
            } catch (err) {
                console.error("Batch AI error:", err.message);
            }

            // Realtime Socket.IO Broadcast
            try {
                const io = getIO();
                io.emit("newSOS", {
                    ...sosResult.rows[0],
                    sender_name: "Mesh Emergency Relay",
                    is_mesh_relay: true
                });
            } catch (e) {}

            results.push({
                mesh_message_id: mesh_message_id || null,
                status: "INGESTED",
                sos_id: sosResult.rows[0].id,
                incident_id: incident.id
            });
        } catch (err) {
            await client.query("ROLLBACK");
            results.push({
                mesh_message_id: mesh_message_id || null,
                status: "FAILED",
                error: err.message
            });
        }
    }

    client.release();

    // Broadcast updated dashboard stats
    try {
        const io = getIO();
        const updatedStats = await getDashboardStatsData();
        io.emit("dashboardStats", updatedStats);
    } catch (e) {}

    return res.status(200).json({
        message: "Mesh batch synchronization processed successfully",
        total_received: packets.length,
        ingested_count: ingestedCount,
        duplicates_ignored: duplicateCount,
        results
    });
};

// -------------------------------------------------------------
// GET MESH STATS (Telemetry)
// -------------------------------------------------------------
const getMeshStats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE mesh_message_id IS NOT NULL) AS mesh_reports,
                COUNT(*) FILTER (WHERE mesh_message_id IS NULL) AS direct_reports,
                COUNT(*) AS total_reports
            FROM sos_reports
        `);

        const recentMesh = await pool.query(`
            SELECT
                s.id,
                s.mesh_message_id,
                s.message,
                s.category,
                s.severity,
                s.created_at,
                ST_Y(s.location::geometry) AS latitude,
                ST_X(s.location::geometry) AS longitude
            FROM sos_reports s
            WHERE s.mesh_message_id IS NOT NULL
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

        res.json({
            summary: result.rows[0],
            recent_mesh_relays: recentMesh.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// -------------------------------------------------------------
// GET ALL SOS
// -------------------------------------------------------------
const getAllSOS = async (req, res) => {
    try {
        const isCitizen = req.user?.role === "CITIZEN";

        const query = isCitizen
            ? `
                SELECT
                    s.id,
                    s.message,
                    s.category,
                    s.severity,
                    s.status,
                    s.created_at,
                    s.incident_id,
                    ST_Y(s.location::geometry) AS latitude,
                    ST_X(s.location::geometry) AS longitude,
                    u.full_name AS sender_name
                FROM sos_reports s
                LEFT JOIN users u
                    ON s.sender_id = u.id
                WHERE s.sender_id = $1
                ORDER BY s.created_at DESC
              `
            : `
                SELECT
                    s.id,
                    s.message,
                    s.category,
                    s.severity,
                    s.status,
                    s.created_at,
                    s.incident_id,
                    ST_Y(s.location::geometry) AS latitude,
                    ST_X(s.location::geometry) AS longitude,
                    u.full_name AS sender_name
                FROM sos_reports s
                LEFT JOIN users u
                    ON s.sender_id = u.id
                ORDER BY s.created_at DESC
              `;

        const params = isCitizen ? [req.user.id] : [];
        const result = await pool.query(query, params);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

// -------------------------------------------------------------
// GET DASHBOARD STATS
// -------------------------------------------------------------
const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsData();
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    createSOS,
    batchMeshSync,
    getMeshStats,
    getAllSOS,
    getDashboardStats
};