const pool = require("../config/db");

const {
    calculatePriorityScore,
    recommendResource,
    estimateResponseTime,
    generateRecommendation
} = require("../services/aiService");


const performAIAnalysis = async (incidentId) => {

    const incidentResult = await pool.query(
        `
        SELECT *
        FROM incidents
        WHERE id = $1
        `,
        [incidentId]
    );

    if (incidentResult.rows.length === 0) {
        throw new Error("Incident not found");
    }

    const incident = incidentResult.rows[0];

    const priorityScore =
        calculatePriorityScore(
            incident.severity,
            incident.category
        );

    const recommendedResource =
        await recommendResource(
            incident.category,
            incident.id
        );

    const estimatedResponseTime =
        estimateResponseTime(priorityScore);

    const recommendation =
        generateRecommendation(
            incident.category,
            incident.severity
        );

    const result = await pool.query(
        `
        INSERT INTO ai_analysis
        (
            incident_id,
            priority_score,
            predicted_category,
            confidence,
            recommendation,
            recommended_resource,
            estimated_response_time
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7
        )
        ON CONFLICT (incident_id)
        DO UPDATE
        SET
            priority_score = EXCLUDED.priority_score,
            predicted_category = EXCLUDED.predicted_category,
            confidence = EXCLUDED.confidence,
            recommendation = EXCLUDED.recommendation,
            recommended_resource = EXCLUDED.recommended_resource,
            estimated_response_time = EXCLUDED.estimated_response_time

        RETURNING *;
        `,
        [
            incident.id,
            priorityScore,
            incident.category,
            100,
            recommendation,
            recommendedResource.name,
            estimatedResponseTime
        ]
    );

    return result.rows[0];

};


const analyzeSOS = async (req, res) => {

    try {

        const { sosId } = req.params;

        const analysis =
            await performAIAnalysis(sosId);

        res.json(analysis);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};


const getAllAnalysis = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                a.*,
                i.category,
                i.severity,
                i.title
            FROM ai_analysis a
            JOIN incidents i
            ON a.incident_id = i.id
            ORDER BY a.analyzed_at DESC
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
    analyzeSOS,
    getAllAnalysis,
    performAIAnalysis
};