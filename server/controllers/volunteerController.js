const pool = require("../config/db");

// -------------------------------------------------------------
// GET ALL VOLUNTEERS & RESPONDERS
// -------------------------------------------------------------
const getAllVolunteers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.id,
                v.user_id,

                u.full_name,
                u.email,
                u.phone,
                u.role,

                v.skills,
                v.availability,

                ST_Y(v.current_location::geometry) AS latitude,
                ST_X(v.current_location::geometry) AS longitude,

                v.last_seen

            FROM volunteers v

            JOIN users u
                ON u.id = v.user_id

            WHERE u.role IN ('VOLUNTEER', 'VOLUNTEER_RESPONDER')

            ORDER BY
                CASE WHEN u.role = 'VOLUNTEER_RESPONDER' THEN 0 ELSE 1 END,
                u.full_name ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

// -------------------------------------------------------------
// ASSIGN VOLUNTEER OR RESPONDER TO AN INCIDENT
// (Allowed for both ADMIN and VOLUNTEER_RESPONDER)
// -------------------------------------------------------------
const assignVolunteer = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { volunteer_id, incident_id, notes } = req.body;

        if (!volunteer_id || !incident_id) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Volunteer ID and incident ID are required"
            });
        }

        // Check volunteer exists and has volunteer role
        const volunteerResult = await client.query(
            `
            SELECT
                v.id,
                v.user_id,
                v.availability,
                u.role
            FROM volunteers v
            JOIN users u
                ON u.id = v.user_id
            WHERE v.id = $1
              AND u.role IN ('VOLUNTEER', 'VOLUNTEER_RESPONDER')
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

        // Check incident exists
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
            SELECT volunteer_id, incident_id
            FROM volunteer_assignments
            WHERE volunteer_id = $1
              AND incident_id = $2
              AND status IN ('ASSIGNED', 'ACTIVE')
            LIMIT 1
            `,
            [volunteer_id, incident_id]
        );

        if (existingAssignment.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                message: "Volunteer is already actively assigned to this incident"
            });
        }

        // Create assignment (recording assigned_by as req.user.id)
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
            [volunteer_id, incident_id, req.user.id, notes || null]
        );

        // Mark volunteer unavailable while on duty
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
            message: "Volunteer assigned to work successfully",
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

// -------------------------------------------------------------
// GET ASSIGNED VOLUNTEERS FOR INCIDENT
// -------------------------------------------------------------
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
                u.role,

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

// -------------------------------------------------------------
// GET MY PERSONAL ASSIGNMENTS (Self-Service)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// GET MY VOLUNTEER PROFILE (Self-Service)
// -------------------------------------------------------------
const getMyVolunteerProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                v.id,
                v.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                v.skills,
                v.availability,
                v.last_seen
             FROM volunteers v
             JOIN users u ON u.id = v.user_id
             WHERE v.user_id = $1
               AND u.role IN ('VOLUNTEER', 'VOLUNTEER_RESPONDER')
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

// -------------------------------------------------------------
// UPDATE MY AVAILABILITY (Self-Service)
// -------------------------------------------------------------
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
                   AND u.role IN ('VOLUNTEER', 'VOLUNTEER_RESPONDER')
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

// -------------------------------------------------------------
// UPDATE VOLUNTEER AVAILABILITY (Admin Override)
// -------------------------------------------------------------
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
              AND u.role IN ('VOLUNTEER', 'VOLUNTEER_RESPONDER')
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

// -------------------------------------------------------------
// DESIGNATE / PROMOTE VOLUNTEER ROLE (Admin Only)
// Sets role to 'VOLUNTEER_RESPONDER' or 'VOLUNTEER'
// -------------------------------------------------------------
const updateVolunteerRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!["VOLUNTEER", "VOLUNTEER_RESPONDER"].includes(role)) {
        return res.status(400).json({
            message: "Role must be either VOLUNTEER or VOLUNTEER_RESPONDER."
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE users
            SET role = $1
            WHERE id = (SELECT user_id FROM volunteers WHERE id = $2)
            RETURNING id, full_name, email, role
            `,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Volunteer not found."
            });
        }

        return res.json({
            message: `Volunteer designated as ${role} successfully.`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};
// -------------------------------------------------------------
// GET PENDING VOLUNTEER REQUESTS (Admin Only)
// -------------------------------------------------------------
const getVolunteerRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.id AS volunteer_id,
                v.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                v.skills,
                v.availability,
                v.created_at,
                u.created_at AS registered_at
            FROM volunteers v
            JOIN users u ON u.id = v.user_id
            WHERE u.role = 'PENDING_VOLUNTEER' OR v.availability = 'PENDING'
            ORDER BY v.created_at DESC
        `);

        return res.json(result.rows);
    } catch (error) {
        console.error("Get volunteer requests error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// -------------------------------------------------------------
// APPROVE VOLUNTEER REQUEST (Admin Only)
// -------------------------------------------------------------
const approveVolunteerRequest = async (req, res) => {
    const { id } = req.params;
    const { assigned_role = "VOLUNTEER", skills } = req.body || {};

    if (!["VOLUNTEER", "VOLUNTEER_RESPONDER"].includes(assigned_role)) {
        return res.status(400).json({
            message: "Assigned role must be either VOLUNTEER or VOLUNTEER_RESPONDER."
        });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");

        const volCheck = await client.query(
            "SELECT id, user_id FROM volunteers WHERE id = $1",
            [id]
        );

        if (volCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Volunteer request not found." });
        }

        const userId = volCheck.rows[0].user_id;

        await client.query(
            `UPDATE users
             SET role = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [assigned_role, userId]
        );

        if (skills && typeof skills === "string" && skills.trim()) {
            await client.query(
                `UPDATE volunteers
                 SET availability = 'AVAILABLE', skills = $1, last_seen = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [skills.trim(), id]
            );
        } else {
            await client.query(
                `UPDATE volunteers
                 SET availability = 'AVAILABLE', last_seen = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [id]
            );
        }

        await client.query("COMMIT");

        return res.json({
            message: `Volunteer approved and assigned as ${assigned_role} successfully.`
        });
    } catch (error) {
        if (client) {
            try { await client.query("ROLLBACK"); } catch (e) {}
        }
        console.error("Approve volunteer error:", error);
        return res.status(500).json({ message: "Server Error" });
    } finally {
        if (client) client.release();
    }
};

// -------------------------------------------------------------
// REJECT VOLUNTEER REQUEST (Admin Only)
// -------------------------------------------------------------
const rejectVolunteerRequest = async (req, res) => {
    const { id } = req.params;

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");

        const volCheck = await client.query(
            "SELECT user_id FROM volunteers WHERE id = $1",
            [id]
        );

        if (volCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Volunteer request not found." });
        }

        const userId = volCheck.rows[0].user_id;

        await client.query(
            "UPDATE users SET role = 'CITIZEN', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId]
        );

        await client.query("DELETE FROM volunteers WHERE id = $1", [id]);

        await client.query("COMMIT");

        return res.json({
            message: "Volunteer application rejected. User remains as standard citizen."
        });
    } catch (error) {
        if (client) {
            try { await client.query("ROLLBACK"); } catch (e) {}
        }
        console.error("Reject volunteer error:", error);
        return res.status(500).json({ message: "Server Error" });
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    getAllVolunteers,
    assignVolunteer,
    getAssignedVolunteers,
    getMyAssignments,
    getMyVolunteerProfile,
    updateMyAvailability,
    updateVolunteerAvailability,
    updateVolunteerRole,
    getVolunteerRequests,
    approveVolunteerRequest,
    rejectVolunteerRequest
};