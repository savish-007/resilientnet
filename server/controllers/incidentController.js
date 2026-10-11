
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
        res.status(500).json({ message: "Server Error" });
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
        res.status(500).json({ message: "Server Error" });
    }
};

const resolveIncident = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const incidentResult = await client.query(
            `
            SELECT id, status
            FROM incidents
            WHERE id = $1
            FOR UPDATE
            `,
            [req.params.id]
        );

        if (incidentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        if (incidentResult.rows[0].status === "RESOLVED") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                message: "Incident is already resolved"
            });
        }

        await client.query(
            `
            UPDATE incidents
            SET status = 'RESOLVED',
                resolved_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [req.params.id]
        );

        await client.query(
            `
            UPDATE volunteer_assignments
            SET status = 'COMPLETED',
                completed_at = CURRENT_TIMESTAMP
            WHERE incident_id = $1
              AND status IN ('ASSIGNED', 'ACTIVE')
            `,
            [req.params.id]
        );

        await client.query(
            `
            UPDATE volunteers v
            SET availability = 'AVAILABLE',
                last_seen = CURRENT_TIMESTAMP
            WHERE EXISTS (
                SELECT 1
                FROM volunteer_assignments va
                WHERE va.volunteer_id = v.id
                  AND va.incident_id = $1
                  AND va.status = 'COMPLETED'
            )
            AND NOT EXISTS (
                SELECT 1
                FROM volunteer_assignments active
                WHERE active.volunteer_id = v.id
                  AND active.status IN ('ASSIGNED', 'ACTIVE')
            )
            `,
            [req.params.id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Incident resolved and related volunteer assignments completed."
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllIncidents,
    getIncidentById,
    resolveIncident
};
