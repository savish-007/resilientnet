const pool = require("../config/db");

const getAllResourceRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                rr.id,
                rr.incident_id,
                i.incident_number,
                i.title AS incident_title,
                rr.requested_by,
                u.full_name AS requested_by_name,
                rr.resource_category,
                rr.resource_name,
                rr.quantity_requested,
                rr.quantity_allocated,
                rr.unit,
                rr.priority,
                rr.status,
                rr.requested_at,
                rr.fulfilled_at,
                rr.notes
            FROM resource_requests rr
            LEFT JOIN incidents i
                ON i.id = rr.incident_id
            LEFT JOIN users u
                ON u.id = rr.requested_by
            ORDER BY rr.requested_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

const getResourceRequestById = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                rr.id,
                rr.incident_id,
                i.incident_number,
                i.title AS incident_title,
                rr.requested_by,
                u.full_name AS requested_by_name,
                rr.resource_category,
                rr.resource_name,
                rr.quantity_requested,
                rr.quantity_allocated,
                rr.unit,
                rr.priority,
                rr.status,
                rr.requested_at,
                rr.fulfilled_at,
                rr.notes
            FROM resource_requests rr
            LEFT JOIN incidents i
                ON i.id = rr.incident_id
            LEFT JOIN users u
                ON u.id = rr.requested_by
            WHERE rr.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource request not found"
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

const createResourceRequest = async (req, res) => {
    try {
        const {
            incident_id,
            resource_category,
            resource_name,
            quantity_requested,
            unit,
            priority,
            notes
        } = req.body;

        if (
            !incident_id ||
            !resource_category ||
            !resource_name ||
            quantity_requested === undefined ||
            !unit
        ) {
            return res.status(400).json({
                message:
                    "Incident, resource category, resource name, quantity and unit are required."
            });
        }

        const incidentCheck = await pool.query(
            `SELECT id FROM incidents WHERE id = $1`,
            [incident_id]
        );

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        const result = await pool.query(`
            INSERT INTO resource_requests (
                incident_id,
                requested_by,
                resource_category,
                resource_name,
                quantity_requested,
                quantity_allocated,
                unit,
                priority,
                status,
                notes
            )
            VALUES (
                $1, $2, $3, $4, $5, 0, $6, $7, 'REQUESTED', $8
            )
            RETURNING *
        `, [
            incident_id,
            req.user.id,
            resource_category,
            resource_name,
            Number(quantity_requested),
            unit,
            priority || "MEDIUM",
            notes || null
        ]);

        res.status(201).json({
            message: "Resource request created successfully",
            request: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

const updateResourceRequest = async (req, res) => {
    try {
        const {
            quantity_allocated,
            priority,
            status,
            notes
        } = req.body;

        const result = await pool.query(`
            UPDATE resource_requests
            SET
                quantity_allocated = COALESCE($1, quantity_allocated),
                priority = COALESCE($2, priority),
                status = COALESCE($3, status),
                notes = COALESCE($4, notes),
                fulfilled_at = CASE
                    WHEN $3 = 'FULFILLED'
                    THEN CURRENT_TIMESTAMP
                    ELSE fulfilled_at
                END
            WHERE id = $5
            RETURNING *
        `, [
            quantity_allocated !== undefined
                ? Number(quantity_allocated)
                : null,
            priority || null,
            status || null,
            notes !== undefined ? notes : null,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource request not found"
            });
        }

        res.json({
            message: "Resource request updated successfully",
            request: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    getAllResourceRequests,
    getResourceRequestById,
    createResourceRequest,
    updateResourceRequest
};