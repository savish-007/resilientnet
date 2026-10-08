const pool = require("../config/db");

// Get all organizations
const getAllOrganizations = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name
            FROM organizations
            ORDER BY name ASC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    getAllOrganizations
};