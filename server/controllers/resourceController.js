const pool = require("../config/db");

// Get All Resources
const getAllResources = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.organization_id,
                o.name AS organization_name,
                r.name,
                r.description,
                r.category,
                r.quantity,
                r.unit,
                r.status,
                r.latitude,
                r.longitude,
                r.created_at,
                r.updated_at
            FROM resources r
            LEFT JOIN organizations o
                ON r.organization_id = o.id
            ORDER BY r.created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};


// Get Single Resource
const getResourceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                r.id,
                r.organization_id,
                o.name AS organization_name,
                r.name,
                r.description,
                r.category,
                r.quantity,
                r.unit,
                r.status,
                r.latitude,
                r.longitude,
                r.created_at,
                r.updated_at
            FROM resources r
            LEFT JOIN organizations o
                ON r.organization_id = o.id
            WHERE r.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
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


// Create Resource
const createResource = async (req, res) => {
    try {
        const {
            organization_id,
            name,
            description,
            category,
            quantity,
            unit,
            latitude,
            longitude,
            status
        } = req.body;

        if (!organization_id || !name || !category || quantity === undefined || !unit) {
            return res.status(400).json({
                message: "organization_id, name, category, quantity and unit are required"
            });
        }

        const validStatuses = [
            "AVAILABLE",
            "BUSY",
            "MAINTENANCE",
            "OFFLINE"
        ];

        const resourceStatus = status || "AVAILABLE";

        if (!validStatuses.includes(resourceStatus)) {
            return res.status(400).json({
                message: "Invalid resource status"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO resources
            (
                organization_id,
                name,
                description,
                category,
                quantity,
                unit,
                status,
                latitude,
                longitude
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9
            )
            RETURNING *
            `,
            [
                organization_id,
                name,
                description || null,
                category,
                quantity,
                unit,
                resourceStatus,
                latitude || null,
                longitude || null
            ]
        );

        res.status(201).json({
            message: "Resource created successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};


// Update Resource
const updateResource = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            organization_id,
            name,
            description,
            category,
            quantity,
            unit,
            latitude,
            longitude,
            status
        } = req.body;

        const validStatuses = [
            "AVAILABLE",
            "BUSY",
            "MAINTENANCE",
            "OFFLINE"
        ];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid resource status"
            });
        }

        const result = await pool.query(
            `
            UPDATE resources
            SET
                organization_id = COALESCE($1, organization_id),
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                category = COALESCE($4, category),
                quantity = COALESCE($5, quantity),
                unit = COALESCE($6, unit),
                latitude = COALESCE($7, latitude),
                longitude = COALESCE($8, longitude),
                status = COALESCE($9, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *
            `,
            [
                organization_id,
                name,
                description,
                category,
                quantity,
                unit,
                latitude,
                longitude,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.json({
            message: "Resource updated successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};


// Delete Resource
const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM resources
            WHERE id = $1
            RETURNING id
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.json({
            message: "Resource deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};


// Change Resource Status
const updateResourceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            "AVAILABLE",
            "BUSY",
            "MAINTENANCE",
            "OFFLINE"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid resource status"
            });
        }

        const result = await pool.query(
            `
            UPDATE resources
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
            `,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        res.json({
            message: "Resource status updated successfully",
            resource: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};


module.exports = {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    updateResourceStatus
};