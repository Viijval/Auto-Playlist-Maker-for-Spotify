# AutoPlaylist

Automatically generate Spotify playlists organised by genre, language, and artist — all from your existing library.

![AutoPlaylist](https://img.shields.io/badge/Built%20with-FastAPI%20%2B%20React-1DB954?style=flat-square&logo=spotify&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What it does

Select any of your Spotify playlists or Liked Songs, choose what you want to generate, and AutoPlaylist analyses everything and creates new playlists directly on your Spotify account.

- **By Genre** — groups songs using Spotify's artist genre data, normalised into clean buckets (K-Pop, Rock, Hip-Hop etc). Uses AI as a fallback for songs Spotify hasn't categorised.
- **By Language** — detects the language of every song using an LLM and groups them accordingly (English, Japanese, Korean, Hindi etc).
- **By Artist** — finds artists you listen to most and creates a dedicated playlist for each.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React + TypeScript + Vite |
| State | Zustand |
| Styling | Tailwind CSS |
| Auth | Spotify OAuth 2.0 |
| AI | Groq (Llama 3.1) |
| Cache | SQLite |
| Spotify | Spotipy |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app
- A [Groq](https://console.groq.com) API key (free, no credit card)

### 1. Clone the repo

```bash
git clone https://github.com/Viijval/Auto-Playlist-Maker-for-Spotify.git
cd Auto-Playlist-Maker-for-Spotify
```

### 2. Backend setup

```bash
cd autoplaylist-backend
pip install -r requirements.txt
```

Create a `.env` file (use `.env.example` as a template):

```
SPOTIPY_CLIENT_ID=your_client_id
SPOTIPY_CLIENT_SECRET=your_client_secret
SPOTIPY_REDIRECT_URI=http://localhost:8888/callback
GROQ_API_KEY=your_groq_key
```

In your Spotify Developer Dashboard, add `http://localhost:8888/callback` as a Redirect URI.

Start the backend:

```bash
uvicorn main:app --reload --port 8888
```

### 3. Frontend setup

```bash
cd autoplaylist-frontend
npm install
npm run dev
```

### 4. Open the app

Go to [http://localhost:5173](http://localhost:5173) and log in with Spotify.

---

## How it works

1. User logs in with Spotify (OAuth 2.0)
2. Selects playlists to analyse
3. Chooses which generators to run (genre / language / artist)
4. Backend fetches all tracks, pulls artist genre data from Spotify, sends uncategorised songs to Groq for AI classification
5. Results are cached in SQLite so the same song is never processed twice
6. User reviews the generated playlists and selects which ones to create
7. Playlists are created on Spotify with an `AP:` prefix

---

## Project Structure

```
autoplaylist-backend/
  main.py          # entire backend — auth, fetching, generation, creation
  .env             # secrets (not committed)
  .env.example     # template for new contributors
  cache.db         # auto-created SQLite cache

autoplaylist-frontend/
  src/
    api.ts               # fetch wrapper with auto token refresh
    store/index.ts       # Zustand global state
    pages/
      AuthPage.tsx       # login screen
      CallbackPage.tsx   # handles OAuth redirect
      PlaylistSelectionPage.tsx
      OptionsPage.tsx
      GeneratingPage.tsx
      ReviewPage.tsx
```

---

## Notes

- Currently limited to 25 Spotify users in development mode. Apply for a quota extension at [developer.spotify.com](https://developer.spotify.com) to open it publicly.
- Genre accuracy depends on Spotify's tagging — some niche artists have no genre data and rely entirely on AI classification.
- The SQLite cache persists between runs. Delete `cache.db` to force a full re-analysis.

---

## License

MIT
