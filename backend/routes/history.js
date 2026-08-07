// ============================================
// HISTORY ROUTES — /api/history  (Recently Played)
// ============================================
const express = require("express");
const db = require("../db/database");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// ---- LOG A PLAY (call this when a song starts playing) ----
router.post("/", requireAuth, (req, res) => {
  const { song_id } = req.body;

  if (!song_id) {
    return res.status(400).json({ error: "song_id is required." });
  }

  const song = db.prepare("SELECT id FROM songs WHERE id = ?").get(song_id);
  if (!song) {
    return res.status(404).json({ error: "Song not found." });
  }

  db.prepare("INSERT INTO history (user_id, song_id) VALUES (?, ?)").run(
    req.user.id,
    song_id,
  );
  res.status(201).json({ message: "History updated." });
});

// ---- GET RECENTLY PLAYED (most recent distinct songs, newest first) ----
router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT songs.*, MAX(history.played_at) AS last_played, MAX(history.id) AS last_history_id
       FROM history
       JOIN songs ON songs.id = history.song_id
       WHERE history.user_id = ?
       GROUP BY songs.id
       ORDER BY last_history_id DESC
       LIMIT 20`,
    )
    .all(req.user.id);

  res.json(rows);
});

// ---- CLEAR HISTORY ----
router.delete("/", requireAuth, (req, res) => {
  db.prepare("DELETE FROM history WHERE user_id = ?").run(req.user.id);
  res.json({ message: "History cleared." });
});

module.exports = router;
