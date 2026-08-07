// ============================================
// SONGS ROUTES — /api/songs
// ============================================
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db/database");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// ---- Multer storage config ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "song") {
      cb(null, path.join(__dirname, "../uploads/songs"));
    } else if (file.fieldname === "cover") {
      cb(null, path.join(__dirname, "../uploads/covers"));
    } else {
      cb(new Error("Unexpected field"), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "song" && !file.mimetype.startsWith("audio/")) {
      return cb(new Error("Only audio files are allowed (mp3, wav, etc)."));
    }
    if (file.fieldname === "cover" && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Cover must be an image file."));
    }
    cb(null, true);
  },
});

// ---- ADD A SONG (protected) ----
router.post(
  "/",
  requireAuth,
  upload.fields([{ name: "song", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  (req, res) => {
    try {
      const { title, artist, album, duration } = req.body;

      if (!title || !artist || !req.files?.song) {
        return res.status(400).json({ error: "Title, artist and song file are required." });
      }

      const filePath = "/uploads/songs/" + req.files.song[0].filename;
      const coverPath = req.files.cover ? "/uploads/covers/" + req.files.cover[0].filename : "";

      const result = db
        .prepare(
          `INSERT INTO songs (title, artist, album, cover_path, file_path, duration, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(title, artist, album || "", coverPath, filePath, Number(duration) || 0, req.user.id);

      const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json({ message: "Song added successfully!", song });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Something went wrong while adding the song." });
    }
  }
);

// ---- LIST ALL SONGS ----
router.get("/", (req, res) => {
  const songs = db.prepare("SELECT * FROM songs ORDER BY created_at DESC").all();
  res.json(songs);
});

// ---- SEARCH SONGS (by title or artist) ----
router.get("/search", (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) {
    return res.json([]);
  }

  const like = `%${q}%`;
  const songs = db
    .prepare(
      `SELECT * FROM songs
       WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
       ORDER BY created_at DESC`
    )
    .all(like, like, like);

  res.json(songs);
});

// ---- DELETE A SONG (protected, only uploader) ----
router.delete("/:id", requireAuth, (req, res) => {
  const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(req.params.id);

  if (!song) {
    return res.status(404).json({ error: "Song not found." });
  }
  if (song.uploaded_by !== req.user.id) {
    return res.status(403).json({ error: "You can only delete songs you uploaded." });
  }

  // Remove files from disk
  const songFile = path.join(__dirname, "..", song.file_path);
  const coverFile = song.cover_path ? path.join(__dirname, "..", song.cover_path) : null;
  if (fs.existsSync(songFile)) fs.unlinkSync(songFile);
  if (coverFile && fs.existsSync(coverFile)) fs.unlinkSync(coverFile);

  db.prepare("DELETE FROM songs WHERE id = ?").run(req.params.id);
  res.json({ message: "Song deleted successfully." });
});

module.exports = router;
