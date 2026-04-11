// backend/src/config/db.js
// PostgreSQL connection pool via node-postgres (pg)
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatz_refined",
  max: 10,                // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Fail fast on startup if DB is unreachable
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  } else {
    console.log("✅ PostgreSQL connected");
    release();
  }
});

module.exports = pool;
