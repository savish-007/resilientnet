const pool = require("../config/db");

const getAllVolunteers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.id,
                v.user_id,

                u.full_name,
                u.email,
                u.phone,

                v.skills,
                v.availability,

                ST_Y(v.current_location::geometry) AS latitude,
                ST_X(v.current_location::geometry) AS longitude,

                v.last_seen

            FROM volunteers v

            JOIN users u
                ON u.id = v.user_id

            WHERE u.role = 'VOLUNTEER'

            ORDER BY u.full_name
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};


const assignVolunteer = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            volunteer_id,
            incident_id,
            notes
        } = req.body;

        if (!volunteer_id || !incident_id) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Volunteer ID and incident ID are required"
            });
        }

        // Check volunteer
        const volunteerResult = await client.query(
            `
            SELECT
                v.id,
                v.user_id,
                v.availability
            FROM volunteers v
            JOIN users u
                ON u.id = v.user_id
            WHERE v.id = $1
              AND u.role = 'VOLUNTEER'
            FOR UPDATE
            `,
            [volunteer_id]
        );

        if (volunteerResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Volunteer not found"
            });
        }

        // Check incident
        const incidentResult = await client.query(
            `
            SELECT id
            FROM incidents
            WHERE id = $1
            `,
            [incident_id]
        );

        if (incidentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Incident not found"
            });
        }

        // Prevent duplicate active assignment
        const existingAssignment = await client.query(
            `
            SELECT
                volunteer_id,
                incident_id
            FROM volunteer_assignments
            WHERE volunteer_id = $1
              AND incident_id = $2
              AND status IN ('ASSIGNED', 'ACTIVE')
            LIMIT 1
            `,
            [
                volunteer_id,
                incident_id
            ]
        );

        if (existingAssignment.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Volunteer is already assigned to this incident"
            });
        }

        // Create assignment
        const assignmentResult = await client.query(
            `
            INSERT INTO volunteer_assignments (
                volunteer_id,
                incident_id,
                assigned_by,
                status,
                assigned_at,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                'ASSIGNED',
                CURRENT_TIMESTAMP,
                $4
            )
            RETURNING *
            `,
            [
                volunteer_id,
                incident_id,
                req.user.id,
                notes || null
            ]
        );

        // Mark volunteer unavailable
        await client.query(
            `
            UPDATE volunteers
            SET
                availability = 'UNAVAILABLE',
                last_seen = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [volunteer_id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Volunteer assigned successfully",
            assignment: assignmentResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    } finally {
        client.release();
    }
};


const getAssignedVolunteers = async (req, res) => {
    try {
        const { incidentId } = req.params;

        const result = await pool.query(
            `
            SELECT
                va.volunteer_id,
                va.incident_id,

                va.assigned_by,
                va.status AS assignment_status,

                va.assigned_at,
                va.started_at,
                va.completed_at,
                va.notes,

                u.id AS user_id,
                u.full_name,
                u.email,
                u.phone,

                v.skills,
                v.availability,
                v.last_seen,

                ST_Y(v.current_location::geometry) AS latitude,
                ST_X(v.current_location::geometry) AS longitude

            FROM volunteer_assignments va

            JOIN volunteers v
                ON v.id = va.volunteer_id

            JOIN users u
                ON u.id = v.user_id

            WHERE va.incident_id = $1

            ORDER BY va.assigned_at DESC
            `,
            [incidentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

const getMyAssignments = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                va.id AS assignment_id,
                va.incident_id,
                va.status AS assignment_status,
                va.assigned_at,
                va.started_at,
                va.completed_at,
                va.notes,
                i.title AS incident_title,
                i.status AS incident_status,
                i.severity
            FROM volunteer_assignments va
            JOIN volunteers v
                ON v.id = va.volunteer_id
            JOIN incidents i
                ON i.id = va.incident_id
            WHERE v.user_id = $1
            ORDER BY va.assigned_at DESC
            `,
            [req.user.id]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};


const getMyVolunteerProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                v.id,
                v.user_id,
                u.full_name,
                u.email,
                v.skills,
                v.availability,
                v.last_seen
             FROM volunteers v
             JOIN users u ON u.id = v.user_id
             WHERE v.user_id = $1
               AND u.role = 'VOLUNTEER'
             LIMIT 1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No volunteer profile is linked to this account."
            });
        }

        return res.json({
            volunteer: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};


const updateMyAvailability = async (req, res) => {
    const { availability } = req.body;

    if (!["AVAILABLE", "UNAVAILABLE"].includes(availability)) {
        return res.status(400).json({
            message: "Availability must be AVAILABLE or UNAVAILABLE."
        });
    }

    try {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const profileResult = await client.query(
                `SELECT v.id, v.availability
                 FROM volunteers v
                 JOIN users u ON u.id = v.user_id
                 WHERE v.user_id = $1
                   AND u.role = 'VOLUNTEER'
                 FOR UPDATE OF v`,
                [req.user.id]
            );

            if (profileResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "No volunteer profile is linked to this account."
                });
            }

            if (availability === "AVAILABLE") {
                const activeResult = await client.query(
                    `SELECT 1
                     FROM volunteer_assignments
                     WHERE volunteer_id = $1
                       AND status IN ('ASSIGNED', 'ACTIVE')
                     LIMIT 1`,
                    [profileResult.rows[0].id]
                );

                if (activeResult.rows.length > 0) {
                    await client.query("ROLLBACK");

                    return res.status(409).json({
                        message: "You still have active assignments and cannot mark yourself available."
                    });
                }
            }

            const updatedResult = await client.query(
                `UPDATE volunteers
                 SET availability = $1,
                     last_seen = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING id, user_id, availability, last_seen`,
                [availability, profileResult.rows[0].id]
            );

            await client.query("COMMIT");

            return res.json({
                message: "Your availability has been updated successfully.",
                volunteer: updatedResult.rows[0]
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};

const updateVolunteerAvailability = async (req, res) => {
    const { availability } = req.body;

    if (!["AVAILABLE", "UNAVAILABLE"].includes(availability)) {
        return res.status(400).json({
            message: "Availability must be AVAILABLE or UNAVAILABLE."
        });
    }

    try {
        if (availability === "AVAILABLE") {
            const activeAssignments = await pool.query(
                `
                SELECT 1
                FROM volunteer_assignments
                WHERE volunteer_id = $1
                  AND status IN ('ASSIGNED', 'ACTIVE')
                LIMIT 1
                `,
                [req.params.id]
            );

            if (activeAssignments.rows.length > 0) {
                return res.status(409).json({
                    message: "This volunteer still has active assignments."
                });
            }
        }

        const result = await pool.query(
            `
            UPDATE volunteers v
            SET availability = $1,
                last_seen = CURRENT_TIMESTAMP
            FROM users u
            WHERE v.user_id = u.id
              AND v.id = $2
              AND u.role = 'VOLUNTEER'
            RETURNING v.id, v.availability, v.last_seen
            `,
            [availability, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Volunteer not found."
            });
        }

        return res.json({
            message: "Volunteer availability updated successfully.",
            volunteer: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
};



module.exports = {
    getAllVolunteers,
    assignVolunteer,
    getAssignedVolunteers,
    getMyAssignments,
    getMyVolunteerProfile,
    updateMyAvailability,
    updateVolunteerAvailability
};