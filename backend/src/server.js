// backend/src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const pool = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const geminiRoutes = require("./routes/gemini.routes");
const chatRoutes = require("./routes/chat.routes"); // ✅ NEW
const noteRoutes = require("./routes/note.routes"); // ✅ NEW

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * CORS configuration (dev-safe)
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, curl, mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS: Origin not allowed"), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

/**
 * Health check
 */
app.get("/api/status", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      api: "OK",
      database: "OK",
      port: PORT,
    });
  } catch (err) {
    res.status(500).json({
      api: "OK",
      database: "FAIL",
      error: err.message,
    });
  }
});

/**
 * Routes
 */
const dashboardRoutes = require("./routes/dashboard.routes"); // ✅ NEW

app.use("/api/auth", authRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/chats", chatRoutes);          // ✅ CHAT PERSISTENCE ROUTES
app.use("/api/notes", noteRoutes);           // ✅ NOTES + FOLDER ROUTES
app.use("/api/dashboard", dashboardRoutes);  // ✅ DASHBOARD SYNC + FOLDER/NOTE/CHAT CRUD

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
