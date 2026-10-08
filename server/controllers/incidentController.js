const pool = require("../config/db");

const getAllIncidents = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                incident_number,
                title,
                description,
                category,
                severity,
                status,
                report_count,
                created_by,
                verified_by,
                resolved_at,
                created_at,
                updated_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM incidents
            ORDER BY created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

const getIncidentById = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                incident_number,
                title,
                description,
                category,
                severity,
                status,
                report_count,
                created_by,
                verified_by,
                resolved_at,
                created_at,
                updated_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude
            FROM incidents
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    getAllIncidents,
    getIncidentById
};