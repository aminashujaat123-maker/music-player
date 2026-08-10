// ============================================
// GLOBAL VARIABLES
// ============================================
if (!isLoggedIn()) {
  window.location.href = "/login.html";
}

const user = getUser();

const content = document.getElementById("content");
const topbarRight = document.getElementById("topbarRight");
const sidebarRecent = document.getElementById("sidebarRecent");
const searchInput = document.getElementById("searchInput");

const audioPlayer = document.getElementById("audioPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const volumeBar = document.getElementById("volumeBar");
const npCover = document.getElementById("npCover");
const npTitle = document.getElementById("npTitle");
const npArtist = document.getElementById("npArtist");
const npEqualizer = document.getElementById("npEqualizer");

const addSongModal = document.getElementById("addSongModal");
const addSongBtn = document.getElementById("addSongBtn");
const cancelAddSong = document.getElementById("cancelAddSong");
const addSongForm = document.getElementById("addSongForm");
const addSongError = document.getElementById("addSongError");

let currentPlaylist = []; // the list currently shown/playable (context for next/prev)
let currentIndex = -1; // index of the song currently playing within currentPlaylist
let currentView = "home";

// ============================================
// TOPBAR (user chip + logout)
// ============================================
function renderTopbar() {
  const initial = (user?.username || "U")[0].toUpperCase();
  topbarRight.innerHTML = `
    <div class="user-chip" id="userChip">
      <div class="avatar">${initial}</div>
      <span style="font-size:14px; font-weight:600;">${escapeHtml(user?.username || "")}</span>
    </div>
  `;
  document.getElementById("userChip").addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) logout();
  });
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updateSeekFill() {
  const percent = seekBar.max > 0 ? (seekBar.value / seekBar.max) * 100 : 0;
  seekBar.style.background = `linear-gradient(to right, var(--accent) ${percent}%, #4d4d4d ${percent}%)`;
}

function updateVolumeFill() {
  const percent = volumeBar.value;
  volumeBar.style.background = `linear-gradient(to right, var(--accent) ${percent}%, #4d4d4d ${percent}%)`;
}

function coverOrPlaceholder(song) {
  return song.cover_path
    ? song.cover_path
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#333"/><text x="50%" y="50%" font-size="60" fill="#666" text-anchor="middle" dominant-baseline="middle">♪</text></svg>`,
      )}`;
}

function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function heroHtml() {
  return `
    <div class="home-hero">
      <div class="home-hero-text">
        <div class="home-hero-eyebrow">Waveform</div>
        <h1>${greetingByTime()}, ${escapeHtml(user?.username || "")}</h1>
        <p>Pick up where you left off, or discover something new from your own collection.</p>
      </div>
      <div class="home-hero-art">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" fill="#1a1a1a" />
          <path d="M50 100a50 50 0 0 1 100 0" stroke="#1DB954" stroke-width="8" fill="none" stroke-linecap="round"/>
          <rect x="38" y="95" width="18" height="45" rx="9" fill="#1DB954"/>
          <rect x="144" y="95" width="18" height="45" rx="9" fill="#1DB954"/>
          <rect x="90" y="60" width="6" height="20" rx="3" fill="#ffffff" opacity="0.6"/>
          <rect x="104" y="50" width="6" height="40" rx="3" fill="#ffffff" opacity="0.8"/>
          <rect x="118" y="65" width="6" height="15" rx="3" fill="#ffffff" opacity="0.5"/>
        </svg>
      </div>
    </div>
  `;
}

// ============================================
// SONG ROW RENDERING (Spotify-style list)
// ============================================
function songRowHtml(song, index) {
  const isPlaying =
    currentIndex === index && currentPlaylist[index]?.id === song.id;
  return `
    <div class="song-row ${isPlaying ? "playing" : ""}" data-id="${song.id}" data-index="${index}">
      <div class="row-index">
        <span class="row-number">${index + 1}</span>
        <button class="row-play-btn" title="Play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="row-equalizer">
          <div class="equalizer"><span></span><span></span><span></span><span></span></div>
        </div>
      </div>
      <img class="row-cover" src="${coverOrPlaceholder(song)}" alt="${escapeHtml(song.title)}" />
      <div class="row-info">
        <div class="row-title">${escapeHtml(song.title)}</div>
        <div class="row-artist">${escapeHtml(song.artist)}</div>
      </div>
      <div class="row-duration">${song.duration ? formatTime(song.duration) : ""}</div>
    </div>
  `;
}

function attachRowHandlers(container, playlist) {
  container.querySelectorAll(".song-row").forEach((row) => {
    row.addEventListener("click", () => {
      const index = Number(row.dataset.index);
      playSong(playlist, index);
    });
  });
}

// ============================================
// VIEWS
// ============================================
async function renderHome() {
  currentView = "home";
  setActiveNav("home");
  content.innerHTML = `<p style="color:var(--text-secondary); padding-top:24px;">Loading...</p>`;

  const [allSongs, recent] = await Promise.all([
    apiFetch("/songs").catch(() => []),
    apiFetch("/history").catch(() => []),
  ]);

  renderSidebarRecent(recent);

  let html = heroHtml();

  if (recent.length > 0) {
    html += `
      <div class="section-heading"><h2>Recently played</h2></div>
      <div class="song-list" id="recentGrid">
        ${recent.map((s, i) => songRowHtml(s, i)).join("")}
      </div>
    `;
  }

  html += `
    <div class="section-heading"><h2>All songs</h2></div>
  `;

  if (allSongs.length === 0) {
    html += `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>
        <h3>No songs yet</h3>
        <p>Click "Add Song" to upload your first track.</p>
      </div>
    `;
  } else {
    html += `<div class="song-list" id="allGrid">${allSongs.map((s, i) => songRowHtml(s, i)).join("")}</div>`;
  }

  content.innerHTML = html;

  if (recent.length > 0) {
    attachRowHandlers(document.getElementById("recentGrid"), recent);
  }
  if (allSongs.length > 0) {
    attachRowHandlers(document.getElementById("allGrid"), allSongs);
  }
}

async function renderLibrary() {
  currentView = "library";
  setActiveNav("library");
  content.innerHTML = `<p style="color:var(--text-secondary); padding-top:24px;">Loading...</p>`;

  const allSongs = await apiFetch("/songs").catch(() => []);
  const mine = allSongs.filter((s) => s.uploaded_by === user.id);

  content.innerHTML = `
    <div class="section-heading"><h2>Your Library</h2></div>
    ${
      mine.length === 0
        ? `<div class="empty-state">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
             <h3>You haven't added any songs yet</h3>
             <p>Use the "Add Song" button to upload your songs.</p>
           </div>`
        : `<div class="song-list" id="libraryGrid">${mine.map((s, i) => songRowHtml(s, i)).join("")}</div>`
    }
  `;

  if (mine.length > 0) {
    attachRowHandlers(document.getElementById("libraryGrid"), mine);
  }
}

function renderSearchView() {
  currentView = "search";
  setActiveNav("search");
  content.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>
      <h3>Search for something</h3>
      <p>Find songs by title, artist, or album.</p>
    </div>
  `;
  searchInput.focus();
}

async function runSearch(query) {
  if (!query.trim()) {
    if (currentView === "search") renderSearchView();
    return;
  }

  currentView = "search";
  setActiveNav("search");

  const results = await apiFetch(
    `/songs/search?q=${encodeURIComponent(query)}`,
  ).catch(() => []);

  content.innerHTML = `
    <div class="section-heading"><h2>Results for "${escapeHtml(query)}"</h2></div>
    ${
      results.length === 0
        ? `<div class="empty-state">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>
             <h3>No results found</h3>
             <p>Try searching for something else.</p>
           </div>`
        : `<div class="song-list" id="searchGrid">${results.map((s, i) => songRowHtml(s, i)).join("")}</div>`
    }
  `;

  if (results.length > 0) {
    attachRowHandlers(document.getElementById("searchGrid"), results);
  }
}

function renderSidebarRecent(recent) {
  if (recent.length === 0) {
    sidebarRecent.innerHTML = `<p style="color:var(--text-muted); font-size:12px; padding:6px 12px;">No history yet</p>`;
    return;
  }
  sidebarRecent.innerHTML = recent
    .slice(0, 8)
    .map(
      (s, i) => `
      <div class="recent-item" data-index="${i}">
        <img src="${coverOrPlaceholder(s)}" alt="" />
        <span>${escapeHtml(s.title)}</span>
      </div>
    `,
    )
    .join("");

  sidebarRecent.querySelectorAll(".recent-item").forEach((item) => {
    item.addEventListener("click", () =>
      playSong(recent, Number(item.dataset.index)),
    );
  });
}

function setActiveNav(view) {
  document.querySelectorAll(".nav-link[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
}

// ============================================
// RECENTLY PLAYED REFRESH HELPERS
// ============================================
async function refreshSidebarRecent() {
  const recent = await apiFetch("/history").catch(() => []);
  renderSidebarRecent(recent);
}

async function refreshHomeRecent() {
  if (currentView !== "home") return;
  const recent = await apiFetch("/history").catch(() => []);
  const grid = document.getElementById("recentGrid");
  if (grid) {
    grid.innerHTML = recent.map((s, i) => songRowHtml(s, i)).join("");
    attachRowHandlers(grid, recent);
  } else if (recent.length > 0) {
    renderHome();
  }
}

// ============================================
// NAV EVENTS
// ============================================
document.querySelectorAll(".nav-link[data-view]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    if (view === "home") renderHome();
    else if (view === "library") renderLibrary();
    else if (view === "search") renderSearchView();
  });
});

let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => runSearch(searchInput.value), 350);
});

// ============================================
// PLAYBACK
// ============================================
function playSong(playlist, index) {
  const song = playlist[index];
  if (!song) return;

  currentPlaylist = playlist;
  currentIndex = index;

  audioPlayer.src = song.file_path;
  audioPlayer.play();

  npTitle.textContent = song.title;
  npArtist.textContent = song.artist;
  if (song.cover_path) {
    npCover.src = song.cover_path;
    npCover.style.display = "block";
  } else {
    npCover.style.display = "none";
  }

  // Log to play history, then refresh the "Recently Played" sections
  apiFetch("/history", {
    method: "POST",
    body: JSON.stringify({ song_id: song.id }),
  })
    .then(() => {
      refreshSidebarRecent();
      refreshHomeRecent();
    })
    .catch(() => {});

  refreshPlayingHighlight();
}

function refreshPlayingHighlight() {
  document.querySelectorAll(".song-row").forEach((row) => {
    const idx = Number(row.dataset.index);
    row.classList.toggle("playing", idx === currentIndex);
  });
}

playPauseBtn.addEventListener("click", () => {
  if (!audioPlayer.src) return;
  if (audioPlayer.paused) audioPlayer.play();
  else audioPlayer.pause();
});

audioPlayer.addEventListener("play", () => {
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";
  npEqualizer.classList.add("active");
  document.body.classList.add("is-playing");
});
audioPlayer.addEventListener("pause", () => {
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  npEqualizer.classList.remove("active");
  document.body.classList.remove("is-playing");
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) playSong(currentPlaylist, currentIndex - 1);
});
nextBtn.addEventListener("click", () => {
  if (currentIndex < currentPlaylist.length - 1)
    playSong(currentPlaylist, currentIndex + 1);
});
audioPlayer.addEventListener("ended", () => {
  if (currentIndex < currentPlaylist.length - 1) {
    playSong(currentPlaylist, currentIndex + 1);
  }
});

audioPlayer.addEventListener("loadedmetadata", () => {
  seekBar.max = Math.floor(audioPlayer.duration);
  totalTimeEl.textContent = formatTime(audioPlayer.duration);
});
audioPlayer.addEventListener("timeupdate", () => {
  seekBar.value = Math.floor(audioPlayer.currentTime);
  currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  updateSeekFill();
});
seekBar.addEventListener("input", () => {
  audioPlayer.currentTime = Number(seekBar.value);
  updateSeekFill();
});

volumeBar.addEventListener("input", () => {
  audioPlayer.volume = Number(volumeBar.value) / 100;
  updateVolumeFill();
});
audioPlayer.volume = 0.8;
updateVolumeFill();

// ============================================
// ADD SONG MODAL
// ============================================
addSongBtn.addEventListener("click", () =>
  addSongModal.classList.remove("hidden"),
);
cancelAddSong.addEventListener("click", () =>
  addSongModal.classList.add("hidden"),
);
addSongModal.addEventListener("click", (e) => {
  if (e.target === addSongModal) addSongModal.classList.add("hidden");
});

addSongForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  addSongError.classList.remove("show");

  const formData = new FormData();
  formData.append("title", document.getElementById("songTitle").value.trim());
  formData.append("artist", document.getElementById("songArtist").value.trim());
  formData.append("album", document.getElementById("songAlbum").value.trim());

  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];
  if (songFile) formData.append("song", songFile);
  if (coverFile) formData.append("cover", coverFile);

  try {
    await apiFetch("/songs", { method: "POST", body: formData });
    addSongModal.classList.add("hidden");
    addSongForm.reset();
    if (currentView === "home") renderHome();
    else if (currentView === "library") renderLibrary();
  } catch (err) {
    addSongError.textContent = err.message;
    addSongError.classList.add("show");
  }
});

// ============================================
// INIT
// ============================================
renderTopbar();
renderHome();
