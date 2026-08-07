// ============================================
// SERVER ENTRY POINT
// ============================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const songRoutes = require("./routes/songs");
const historyRoutes = require("./routes/history");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Serve uploaded audio/cover files ----
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/history", historyRoutes);

// ---- Serve frontend (the public folder) ----
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- Error handler (catches multer errors etc.) ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error." });
});

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
