# Waveform — Spotify-style Music Player

Full-stack music player: HTML/CSS/JS frontend + Node.js/Express backend + SQLite database.

## Features
- Signup / Login (JWT-based auth, passwords hashed with bcrypt)
- Add your own songs (mp3 upload + optional cover image)
- Search songs by title, artist, or album
- Recently played history (per user)
- Spotify-style dark UI with a working audio player (play/pause, next/prev, seek, volume)

## Folder structure
```
backend/
  server.js          -> app entry point
  db/database.js      -> SQLite schema + connection
  routes/              -> auth.js, songs.js, history.js
  middleware/auth.js   -> JWT verification
  uploads/             -> uploaded song + cover files (gitignored)
  public/              -> frontend (index.html, login.html, signup.html, css/, js/)
```

## Setup (VS Code / local machine)

1. Open the `backend` folder in VS Code (`File > Open Folder`).
2. Open a terminal (`` Ctrl+` ``) and install dependencies:
   ```
   npm install
   ```
3. `.env` file already has default values — for real use, change `JWT_SECRET` to a long random string.
4. Start the server:
   ```
   npm start
   ```
5. Open your browser at **http://localhost:5000** — it will redirect to the login page.
6. Sign up for a new account, then start adding songs from the "Add Song" button in the sidebar.

## Pushing to GitHub

From inside the `backend` folder (or the project root — your choice, just be consistent):

```
git init
git add .
git commit -m "Initial commit: music player with auth, search, history"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Note: `node_modules/`, `.env`, `*.db` files, and uploaded songs/covers are already excluded via `.gitignore` — you don't want to commit those.

## Notes
- Database file (`musicplayer.db`) is created automatically the first time you run the server.
- Uploaded songs/covers are saved in `backend/uploads/` — this folder is gitignored so your repo doesn't get huge from audio files.
