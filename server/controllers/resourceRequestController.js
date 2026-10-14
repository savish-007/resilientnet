const pool = require("../config/db");
const { randomUUID } = require("crypto");

// ============================================================
// GET ALL RESOURCE REQUESTS
// ============================================================

const getAllResourceRequests = async (req, res) => {
    try {
        const isCitizen = req.user?.role === "CITIZEN";

        const query = isCitizen
            ? `
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
                WHERE rr.requested_by = $1
                ORDER BY rr.requested_at DESC
              `
            : `
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

const getResourceRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT rr.*, i.incident_number, i.title AS incident_title, u.full_name AS requested_by_name
             FROM resource_requests rr
             LEFT JOIN incidents i ON i.id = rr.incident_id
             LEFT JOIN users u ON u.id = rr.requested_by
             WHERE rr.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Resource request not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
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
            notes,
            latitude,
            longitude
        } = req.body;

        if (
            !resource_category ||
            !resource_name ||
            quantity_requested === undefined ||
            !unit
        ) {
            return res.status(400).json({
                message: "Resource category, resource name, quantity and unit are required."
            });
        }

        let targetIncidentId = incident_id;

        // If no incident_id was provided (e.g. from Citizen Portal), link to their active incident or create one
        if (!targetIncidentId) {
            const existingIncident = await pool.query(
                `SELECT id FROM incidents WHERE created_by = $1 AND status != 'RESOLVED' ORDER BY created_at DESC LIMIT 1`,
                [req.user.id]
            );

            if (existingIncident.rows.length > 0) {
                targetIncidentId = existingIncident.rows[0].id;
            } else {
                const incNumber = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
                const incLat = Number.isFinite(Number(latitude)) ? Number(latitude) : 0;
                const incLng = Number.isFinite(Number(longitude)) ? Number(longitude) : 0;

                const newIncident = await pool.query(
                    `INSERT INTO incidents
                        (incident_number, title, description, category, severity, status, report_count, created_by, location)
                     VALUES
                        ($1, $2, $3, $4, $5, 'NEW', 1, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
                     RETURNING id`,
                    [
                        incNumber,
                        `Citizen Assistance: ${resource_name}`,
                        notes || `Emergency resource request for ${quantity_requested} ${unit} of ${resource_name}`,
                        resource_category || "Logistics",
                        priority || "HIGH",
                        req.user.id,
                        incLng,
                        incLat
                    ]
                );
                targetIncidentId = newIncident.rows[0].id;
            }
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
                $1,
                $2,
                $3,
                $4,
                $5,
                0,
                $6,
                $7,
                'REQUESTED',
                $8
            )
            RETURNING *
        `, [
            targetIncidentId,
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
            resourceRequest: result.rows[0]
        });

    } catch (error) {
        console.error("Create resource request error:", error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

// ============================================================
// UPDATE RESOURCE REQUEST + RESOURCE INVENTORY
// ============================================================

const updateResourceRequest = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            quantity_allocated,
            priority,
            status,
            notes
        } = req.body;

        await client.query("BEGIN");


        // ----------------------------------------------------
        // 1. Get and lock the existing request
        // ----------------------------------------------------

        const requestResult = await client.query(`
            SELECT *
            FROM resource_requests
            WHERE id = $1
            FOR UPDATE
        `, [req.params.id]);

        if (requestResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Resource request not found"
            });
        }

        const existingRequest = requestResult.rows[0];


        // ----------------------------------------------------
        // 2. Calculate allocation change
        // ----------------------------------------------------

        const oldAllocated = Number(
            existingRequest.quantity_allocated || 0
        );

        const newAllocated =
            quantity_allocated !== undefined
                ? Number(quantity_allocated)
                : oldAllocated;


        // ----------------------------------------------------
        // 3. Validate quantity
        // ----------------------------------------------------

        if (
            !Number.isFinite(newAllocated) ||
            newAllocated < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Quantity allocated must be a valid non-negative number."
            });
        }

        if (
            newAllocated >
            Number(existingRequest.quantity_requested)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Quantity allocated cannot be greater than quantity requested."
            });
        }


        const allocationDifference =
            newAllocated - oldAllocated;


        // ----------------------------------------------------
        // 4. Update resource inventory
        // ----------------------------------------------------

        if (allocationDifference !== 0) {

            const resourceResult = await client.query(`
                SELECT
                    id,
                    name,
                    category,
                    quantity,
                    status
                FROM resources
                WHERE LOWER(category) = LOWER($2)
                AND (
                    LOWER(name) = LOWER($1)
                    OR (
                        LOWER($1) = 'ambulance'
                        AND LOWER(name) = 'basic ambulance'
                    )
                )
                ORDER BY
                    CASE
                        WHEN LOWER(name) = LOWER($1)
                        THEN 0
                        ELSE 1
                    END,
                    quantity DESC
                LIMIT 1
                FOR UPDATE
            `, [
                existingRequest.resource_name,
                existingRequest.resource_category
            ]);


            if (resourceResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    message:
                        "Matching resource was not found in the resource inventory."
                });
            }


            const resource =
                resourceResult.rows[0];

            const currentResourceQuantity =
                Number(resource.quantity || 0);


            // ------------------------------------------------
            // Increasing allocation
            // ------------------------------------------------

            if (allocationDifference > 0) {

                if (
                    currentResourceQuantity <
                    allocationDifference
                ) {

                    await client.query("ROLLBACK");

                    return res.status(400).json({
                        message:
                            `Insufficient ${resource.name} inventory. ` +
                            `Available: ${currentResourceQuantity}, ` +
                            `additional required: ${allocationDifference}.`
                    });
                }


                const updatedQuantity =
                    currentResourceQuantity -
                    allocationDifference;


                await client.query(`
                    UPDATE resources
                    SET
                        quantity = $1,
                        status = CASE
                            WHEN $1 = 0
                            THEN 'BUSY'
                            ELSE status
                        END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [
                    updatedQuantity,
                    resource.id
                ]);
            }


            // ------------------------------------------------
            // Decreasing allocation
            // ------------------------------------------------

            if (allocationDifference < 0) {

                const releasedQuantity =
                    Math.abs(allocationDifference);


                const updatedQuantity =
                    currentResourceQuantity +
                    releasedQuantity;


                await client.query(`
                    UPDATE resources
                    SET
                        quantity = $1,
                        status = CASE
                            WHEN $1 > 0
                                 AND status = 'BUSY'
                            THEN 'AVAILABLE'
                            ELSE status
                        END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [
                    updatedQuantity,
                    resource.id
                ]);
            }
        }


        // ----------------------------------------------------
        // 5. Prepare final request values
        // ----------------------------------------------------

        const finalPriority =
            priority || existingRequest.priority;

        const finalStatus =
            status || existingRequest.status;

        const finalNotes =
            notes !== undefined
                ? notes
                : existingRequest.notes;


        // ----------------------------------------------------
        // 6. Update resource request
        // ----------------------------------------------------

        const result = await client.query(`
            UPDATE resource_requests
            SET
                quantity_allocated = $1,
                priority = $2,
                status = $3,
                notes = $4,
                fulfilled_at = CASE
                    WHEN $3::varchar = 'FULFILLED'
                    THEN COALESCE(
                        fulfilled_at,
                        CURRENT_TIMESTAMP
                    )
                    ELSE fulfilled_at
                END
            WHERE id = $5
            RETURNING *
        `, [
            newAllocated,
            finalPriority,
            finalStatus,
            finalNotes,
            req.params.id
        ]);


        // ----------------------------------------------------
        // 7. Commit transaction
        // ----------------------------------------------------

        await client.query("COMMIT");


        res.json({
            message:
                "Resource request updated successfully",
            request: result.rows[0]
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Update Resource Request Error:",
            error
        );

        res.status(500).json({
            message: "Server Error"
        });

    } finally {

        client.release();
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getAllResourceRequests,
    getResourceRequestById,
    createResourceRequest,
    updateResourceRequest
};