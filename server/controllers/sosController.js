const pool = require("../config/db");
const { getIO } = require("../sockets/socket");
const { performAIAnalysis } = require("./aiController");

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

const createSOS = async (req, res) => {
    const {
        message,
        category,
        severity,
        latitude,
        longitude,
        mesh_message_id,
        incident_id
    } = req.body;

    try {
        if (!incident_id) {
            return res.status(400).json({
                message: "incident_id is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO sos_reports
            (
                sender_id,
                message,
                category,
                severity,
                status,
                location,
                mesh_message_id,
                incident_id
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'NEW',
                ST_GeogFromText($5),
                $6,
                $7
            )
            RETURNING *`,
            [
                req.user.id,
                message,
                category,
                severity,
                `POINT(${longitude} ${latitude})`,
                mesh_message_id,
                incident_id
            ]
        );

        const newSOS = result.rows[0];

        await performAIAnalysis(incident_id);

        const io = getIO();

        const sender = await pool.query(
            "SELECT full_name FROM users WHERE id = $1",
            [req.user.id]
        );

        const response = {
            ...newSOS,
            sender_name: sender.rows[0]?.full_name || null
        };

        io.emit("newSOS", response);

        const updatedStats = await getDashboardStatsData();

        io.emit("dashboardStats", updatedStats);

        res.status(201).json({
            message: "SOS Report Created Successfully",
            sos: newSOS
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

const getAllSOS = async (req, res) => {
    try {
        const result = await pool.query(`
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
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

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
    getAllSOS,
    getDashboardStats
};

