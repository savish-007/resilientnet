const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Pool } = require("pg");

const requiredVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
];

const missingVariables = requiredVariables.filter(
    (key) => !process.env[key]
);

if (missingVariables.length > 0) {
    throw new Error(
        `Missing required database environment variables: ${missingVariables.join(", ")}`
    );
}

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    ...(process.env.DB_SSL === "true"
        ? { ssl: { rejectUnauthorized: true } }
        : {}),
});

pool.on("error", (err) => {
    console.error("Unexpected idle database connection error:", err.message);
});

module.exports = pool;