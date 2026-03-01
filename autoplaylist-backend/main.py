import os
import sqlite3
import json
import re
from groq import Groq
from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth

load_dotenv()

app = FastAPI()

# needed this so the browser doesn't block requests from localhost:5173 to localhost:8888
# basically React and FastAPI run on different ports, without this nothing works
app.add_middleware(
    CORSMiddleware,
    
    #allow_origins=["http://localhost:5173"],
    allow_origins=["https://auto-playlist-maker-for-spotify.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# these are the permissions we need from the user's Spotify account
# read their playlists, read their liked songs, and create new playlists
SCOPE = (
    "playlist-read-private "
    "playlist-read-collaborative "
    "user-library-read "
    "playlist-modify-public"
)

# sets up the Spotify OAuth flow using credentials from .env
# this handles the login redirect and token exchange
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope=SCOPE,
)

# groq is the AI we use for language detection and genre fallback
# switched from Gemini because Groq is free with no credit card needed
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -------------------------------------------------------------------
# SQLite cache — so we don't call the AI API for the same song twice
# the db file gets created automatically next to main.py
# if you delete it, it just recreates on next startup (you lose cache though)
# -------------------------------------------------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), "cache.db")

def _init_db():
    # creates the table if it doesn't exist yet
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS song_cache (
            key TEXT PRIMARY KEY,
            language TEXT,
            llm_genre TEXT
        )
    """)
    con.commit()
    con.close()

_init_db()

def _cache_get(track_ids: list[str]) -> dict[str, dict]:
    # looks up a bunch of track IDs at once and returns whatever we've saved before
    if not track_ids:
        return {}
    con = sqlite3.connect(DB_PATH)
    placeholders = ",".join("?" * len(track_ids))
    rows = con.execute(
        f"SELECT key, language, llm_genre FROM song_cache WHERE key IN ({placeholders})",
        track_ids
    ).fetchall()
    con.close()
    return {row[0]: {"language": row[1], "llm_genre": row[2]} for row in rows}

def _cache_set(results: dict[str, dict]):
    # saves AI results to the db
    # important: we skip saving if both fields are null — don't want to permanently
    # cache a failed API call as "Unknown" forever
    if not results:
        return
    rows = [
        (tid, v.get("language"), v.get("llm_genre"))
        for tid, v in results.items()
        if v.get("language") or v.get("llm_genre")
    ]
    if not rows:
        return
    con = sqlite3.connect(DB_PATH)
    con.executemany(
        "INSERT OR REPLACE INTO song_cache (key, language, llm_genre) VALUES (?, ?, ?)",
        rows
    )
    con.commit()
    con.close()


# -------------------------------------------------------------------
# AI batch call — sends songs to Groq and gets back language/genre
# we batch 25 songs per request because Llama cuts off if we send too many
# the prompt asks for a raw JSON array so we can parse it directly
# -------------------------------------------------------------------

def _call_groq_batch(
    tracks: list[dict],
    existing_genres: set[str],
    need_language: bool,
    need_genre: bool,
) -> dict[str, dict]:
    if not tracks:
        return {}

    # build the numbered song list for the prompt
    lines = []
    for i, t in enumerate(tracks, 1):
        artist_str = ", ".join(a["name"] for a in t["artists"])
        lines.append(f"{i}. {t['name']} — {artist_str}")

    # figure out what we actually need from the AI for this batch
    fields = []
    if need_language:
        fields.append('"language": "<language name in English, e.g. English, Japanese, Hindi, Korean>"')
    if need_genre:
        genre_hint = ""
        if existing_genres:
            # give it a hint of genres we already have so it tries to match
            # instead of making up completely new ones
            sample = sorted(existing_genres)[:20]
            genre_hint = f' Prefer matching from this existing list if accurate: {json.dumps(sample)}. If none fit well, suggest a concise new genre name.'
        fields.append(f'"genre": "<single most fitting music genre>"{genre_hint}')

    field_str = ", ".join(fields)

    prompt = f"""You are a music analyst. For each song below, return ONLY a JSON array.
Each element must be an object with exactly these fields: {field_str}
One object per song, in the same order. No explanation, no markdown, just the raw JSON array.

Songs:
{chr(10).join(lines)}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,  # low temp = more consistent, less random
            max_tokens=4096,
        )
        raw = response.choices[0].message.content.strip()
        # sometimes the model wraps the response in ```json ``` even though we said not to
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        parsed = json.loads(raw)
    except Exception as e:
        print(f"groq error: {e}")
        return {}

    # map results back to track IDs
    results = {}
    for i, t in enumerate(tracks):
        if i >= len(parsed):
            break
        entry = parsed[i]
        results[t["track_id"]] = {
            "language": entry.get("language") if need_language else None,
            "llm_genre": entry.get("genre") if need_genre else None,
        }

    return results


# -------------------------------------------------------------------
# Genre normaliser — Spotify gives very specific genre tags like
# "korean pop", "k-pop", "k pop" which are all the same thing.
# this maps them into clean readable buckets like "K-Pop"
# add more mappings here if you notice genres being missed
# -------------------------------------------------------------------

GENRE_MAP = [
    (["k-pop", "korean pop", "k pop", "kpop", "korean r&b", "korean indie"], "K-Pop"),
    (["j-pop", "japanese pop", "anime", "j pop", "jpop", "j-rock", "japanese rock", "visual kei", "j-idol"], "J-Pop / Anime"),
    (["pop", "electropop", "dance pop", "synth-pop", "indie pop", "art pop", "power pop", "teen pop", "europop"], "Pop"),
    (["hip hop", "rap", "trap", "hip-hop", "underground hip hop", "east coast hip hop", "west coast rap", "gangster rap"], "Hip-Hop"),
    (["r&b", "soul", "neo soul", "contemporary r&b", "urban contemporary", "funk"], "R&B / Soul"),
    (["rock", "indie rock", "alternative rock", "classic rock", "hard rock", "soft rock", "garage rock", "punk rock", "post-punk", "grunge", "emo", "metalcore", "metal", "heavy metal"], "Rock"),
    (["edm", "electronic", "house", "techno", "trance", "dubstep", "drum and bass", "dnb", "electro", "ambient", "lo-fi", "chillwave", "synthwave"], "Electronic"),
    (["latin", "reggaeton", "latin pop", "salsa", "bachata", "cumbia", "latin hip hop"], "Latin"),
    (["classical", "orchestral", "instrumental", "piano", "chamber music", "opera"], "Classical"),
    (["country", "folk", "americana", "bluegrass", "singer-songwriter"], "Country / Folk"),
]

def _normalise_genre(genre: str) -> str:
    # checks if the raw genre string matches any of our keyword lists
    # returns the clean bucket name if found, otherwise just title-cases the original
    g = genre.lower().strip()
    for keywords, bucket in GENRE_MAP:
        if any(k in g for k in keywords):
            return bucket
    return genre.title()


# pulls the access token out of the Authorization header and returns a Spotify client
# every protected endpoint calls this at the top
def get_spotify_client(authorization: str) -> spotipy.Spotify:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    return spotipy.Spotify(auth=token)


# =======================================================================
# AUTH ROUTES
# handles login, the Spotify callback, and token refresh
# =======================================================================

@app.get("/")
def home():
    return {"message": "Spotify Backend is Live", "login_url": "/login"}


@app.get("/login")
def login():
    # generates the Spotify login URL and redirects the user there
    auth_url = sp_oauth.get_authorize_url(show_dialog=True)
    return RedirectResponse(auth_url)


@app.get("/callback")
def callback(request: Request):
    # Spotify calls this after the user logs in, with a short-lived code
    # we exchange that code for an access token + refresh token
    # then send both to the frontend via URL params
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code from Spotify")
    token_info = sp_oauth.get_access_token(code)
    access_token = token_info["access_token"]
    refresh_token = token_info.get("refresh_token", "")
    frontend_url = (
        f"https://auto-playlist-maker-for-spotify.vercel.app/callback"
        f"?token={access_token}"
        f"&refresh={refresh_token}"
    )
    return RedirectResponse(frontend_url)


@app.post("/refresh")
def refresh_token_endpoint(request_body: dict):
    # Spotify tokens expire after 1 hour
    # the frontend calls this when it gets a 401, we swap the refresh token for a new access token
    # user never notices anything happened
    refresh = request_body.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="Missing refresh_token")
    try:
        token_info = sp_oauth.refresh_access_token(refresh)
        return {"access_token": token_info["access_token"]}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not refresh token: {e}")


# =======================================================================
# PLAYLIST & TRACK FETCHING
# these endpoints grab data from the user's Spotify account
# =======================================================================

@app.get("/playlists")
def get_playlists(authorization: str = Header(None)):
    # returns all the user's playlists + their liked songs as a special entry
    # Spotify only gives 50 at a time so we loop until we have everything
    sp = get_spotify_client(authorization)
    result = []

    # liked songs isn't a real playlist in Spotify's API, it's separate
    # we fake it as a playlist with id "liked" so the frontend can treat it the same
    liked = sp.current_user_saved_tracks(limit=1)
    result.append({
        "id": "liked",
        "name": "Liked Songs",
        "track_count": liked["total"],
        "type": "liked",
    })

    offset = 0
    while True:
        response = sp.current_user_playlists(limit=50, offset=offset)
        for item in response["items"]:
            result.append({
                "id": item["id"],
                "name": item["name"],
                "track_count": item["tracks"]["total"],
                "type": "playlist",
            })
        if response["next"]:
            offset += 50
        else:
            break

    return result


@app.get("/tracks")
def get_tracks(playlist_ids: str, authorization: str = Header(None)):
    # takes a comma-separated list of playlist IDs and returns all their tracks
    # not actually used in the main flow anymore (generate does its own fetching)
    # keeping it in case it's useful later
    sp = get_spotify_client(authorization)
    ids = [pid.strip() for pid in playlist_ids.split(",") if pid.strip()]
    all_tracks = []

    for playlist_id in ids:
        if playlist_id == "liked":
            tracks = _fetch_liked_songs(sp)
        else:
            tracks = _fetch_playlist_tracks(sp, playlist_id)
        for track in tracks:
            track["playlist_source"] = playlist_id
        all_tracks.extend(tracks)

    return all_tracks


def _fetch_liked_songs(sp: spotipy.Spotify) -> list:
    # liked songs max out at 50 per request, so we page through all of them
    tracks = []
    offset = 0
    while True:
        response = sp.current_user_saved_tracks(limit=50, offset=offset)
        for item in response["items"]:
            track = item["track"]
            if track:  # Spotify occasionally returns null tracks, skip those
                tracks.append(_format_track(track))
        if response["next"]:
            offset += 50
        else:
            break
    return tracks


def _fetch_playlist_tracks(sp: spotipy.Spotify, playlist_id: str) -> list:
    # same idea but for regular playlists — 100 per request this time
    tracks = []
    offset = 0
    while True:
        response = sp.playlist_tracks(playlist_id, limit=100, offset=offset)
        for item in response["items"]:
            track = item.get("track")
            if track and track.get("id"):  # skip local files, they have no ID
                tracks.append(_format_track(track))
        if response["next"]:
            offset += 100
        else:
            break
    return tracks


def _format_track(track: dict) -> dict:
    # strips out only the fields we actually need from Spotify's massive track object
    return {
        "track_id": track["id"],
        "name": track["name"],
        "artists": [{"id": a["id"], "name": a["name"]} for a in track["artists"]],
        "album": track["album"]["name"],
        "release_date": track["album"]["release_date"],
    }


# =======================================================================
# GENERATION PIPELINE
# this is the main endpoint — does all the heavy lifting
# takes selected playlists + options, returns grouped playlist data
# =======================================================================

@app.post("/generate")
def generate(request_body: dict, authorization: str = Header(None)):
    sp = get_spotify_client(authorization)
    opts = request_body.get("options", {})
    playlist_ids = request_body.get("playlist_ids", [])

    # read all the options the user set on the frontend
    want_genre    = opts.get("genre", True)
    want_artist   = opts.get("artist", True)
    want_language = opts.get("language", True)
    allow_dupes   = opts.get("allow_duplicates", False)
    artist_min    = max(3, int(opts.get("artist_min_appearances", 5)))  # minimum 3, can't go lower
    max_genres    = int(opts.get("max_genres", 10))
    max_artists   = int(opts.get("max_artists", 5))
    max_languages = int(opts.get("max_languages", 3))

    # --- step 1: fetch all tracks from selected playlists ---
    # if the same song appears in two playlists, we only process it once
    all_tracks = []
    seen_ids: set[str] = set()
    for pid in playlist_ids:
        raw = _fetch_liked_songs(sp) if pid == "liked" else _fetch_playlist_tracks(sp, pid)
        all_tracks.extend(raw)

    unique_tracks = []
    for t in all_tracks:
        if t["track_id"] not in seen_ids:
            seen_ids.add(t["track_id"])
            unique_tracks.append(t)

    # --- step 2: get genre tags from Spotify for every artist ---
    # Spotify gives genres per artist, not per track, so we collect all artist IDs
    # then batch-fetch them 50 at a time (that's Spotify's API limit per call)
    artist_id_to_genres: dict[str, list[str]] = {}
    artist_id_to_name: dict[str, str] = {}
    all_artist_ids: list[str] = []

    for track in unique_tracks:
        for artist in track["artists"]:
            if artist["id"] not in artist_id_to_name:
                artist_id_to_name[artist["id"]] = artist["name"]
                all_artist_ids.append(artist["id"])

    for i in range(0, len(all_artist_ids), 50):
        batch = all_artist_ids[i:i+50]
        try:
            result = sp.artists(batch)
            for a in result["artists"]:
                if a:
                    artist_id_to_genres[a["id"]] = [g.title() for g in a.get("genres", [])]
        except Exception:
            pass  # if a batch fails just skip it, not worth crashing over

    # collect every genre Spotify gave us — used later as a hint for the AI
    existing_spotify_genres: set[str] = set()
    for genres in artist_id_to_genres.values():
        existing_spotify_genres.update(genres)

    # --- step 3: figure out which tracks need the AI ---
    # genre: only send to AI if Spotify had nothing for all that track's artists
    # language: always send to AI, Spotify has zero language data
    tracks_need_llm_genre: set[str] = set()
    tracks_need_language: set[str] = set()

    for track in unique_tracks:
        has_spotify_genre = any(
            artist_id_to_genres.get(a["id"], []) for a in track["artists"]
        )
        if want_genre and not has_spotify_genre:
            tracks_need_llm_genre.add(track["track_id"])
        if want_language:
            tracks_need_language.add(track["track_id"])

    # --- step 4: check cache, then call AI for anything not cached ---
    all_llm_ids = list(tracks_need_llm_genre | tracks_need_language)
    cached = _cache_get(all_llm_ids)

    def needs_groq(track: dict) -> bool:
        # returns True if this track is missing any info we need from the AI
        tid = track["track_id"]
        c = cached.get(tid, {})
        if tid in tracks_need_language and not c.get("language"):
            return True
        if tid in tracks_need_llm_genre and not c.get("llm_genre"):
            return True
        return False

    to_call = [t for t in unique_tracks if needs_groq(t)]

    # 25 per batch — Llama cuts off the JSON response if we send more than that
    new_cache: dict[str, dict] = {}
    BATCH = 25
    for i in range(0, len(to_call), BATCH):
        batch = to_call[i:i+BATCH]
        need_lang  = any(t["track_id"] in tracks_need_language  for t in batch)
        need_genre = any(t["track_id"] in tracks_need_llm_genre for t in batch)

        results = _call_groq_batch(
            tracks=batch,
            existing_genres=existing_spotify_genres,
            need_language=need_lang,
            need_genre=need_genre,
        )
        new_cache.update(results)

    _cache_set(new_cache)
    full_llm: dict[str, dict] = {**cached, **new_cache}

    # --- step 5: build artist playlists ---
    # count how many tracks each artist appears in across all selected playlists
    # only artists above the threshold get a playlist, sorted by most tracks
    artist_results: dict[str, list[str]] = {}

    if want_artist:
        artist_count: dict[str, int] = {}
        artist_tracks: dict[str, list[str]] = {}

        for track in unique_tracks:
            for artist in track["artists"]:
                aid = artist["id"]
                artist_count[aid] = artist_count.get(aid, 0) + 1
                artist_tracks.setdefault(aid, []).append(track["track_id"])

        qualifying = sorted(
            [(aid, cnt) for aid, cnt in artist_count.items() if cnt >= artist_min],
            key=lambda x: x[1], reverse=True
        )
        for aid, _ in qualifying[:max_artists]:
            name = artist_id_to_name.get(aid, "Unknown Artist")
            artist_results[name] = artist_tracks[aid]

    # --- step 6: build genre playlists ---
    # first try Spotify genres, fall back to AI genre if Spotify had nothing
    # then normalise everything into clean buckets (e.g. "k-pop" -> "K-Pop")
    genre_results: dict[str, list[str]] = {}

    if want_genre:
        genre_tracks: dict[str, list[str]] = {}

        for track in unique_tracks:
            raw_genres: set[str] = set()

            for artist in track["artists"]:
                raw_genres.update(artist_id_to_genres.get(artist["id"], []))

            # if Spotify had nothing, use what the AI suggested
            if not raw_genres:
                llm_genre = full_llm.get(track["track_id"], {}).get("llm_genre")
                if llm_genre:
                    raw_genres.add(llm_genre)

            # normalise into cleaner broader genre names
            track_genres: set[str] = set()
            for g in raw_genres:
                track_genres.add(_normalise_genre(g))

            if not track_genres:
                track_genres = {"Other"}

            for genre in track_genres:
                genre_tracks.setdefault(genre, [])
                if allow_dupes or track["track_id"] not in genre_tracks[genre]:
                    genre_tracks[genre].append(track["track_id"])

        # sort by most songs, take the top N
        sorted_genres = sorted(genre_tracks.items(), key=lambda x: len(x[1]), reverse=True)
        for name, tids in sorted_genres[:max_genres]:
            genre_results[name] = tids

    # --- step 7: build language playlists ---
    # entirely AI-driven since Spotify has no language data at all
    language_results: dict[str, list[str]] = {}

    if want_language:
        lang_tracks: dict[str, list[str]] = {}

        for track in unique_tracks:
            lang = full_llm.get(track["track_id"], {}).get("language") or "Unknown"
            lang_tracks.setdefault(lang, [])
            if allow_dupes or track["track_id"] not in lang_tracks[lang]:
                lang_tracks[lang].append(track["track_id"])

        sorted_langs = sorted(lang_tracks.items(), key=lambda x: len(x[1]), reverse=True)
        for name, tids in sorted_langs[:max_languages]:
            language_results[name] = tids

    # build a song name lookup so the frontend can show real names in the preview panel
    track_details = {
        t["track_id"]: {
            "name": t["name"],
            "artists": ", ".join(a["name"] for a in t["artists"])
        }
        for t in unique_tracks
    }

    return {
        "status": "ok",
        "results": {
            "genre":    genre_results,
            "language": language_results,
            "artist":   artist_results,
        },
        "track_details": track_details,
    }


# =======================================================================
# CREATE PLAYLISTS
# takes the user's final selection and actually creates them on Spotify
# =======================================================================

@app.post("/create-playlists")
def create_playlists(request_body: dict, authorization: str = Header(None)):
    sp = get_spotify_client(authorization)
    user_id = sp.current_user()["id"]
    playlists = request_body.get("playlists", [])
    created = []

    for entry in playlists:
        name = entry.get("name", "AutoPlaylist")
        track_ids = entry.get("track_ids", [])
        if not track_ids:
            continue

        # create an empty playlist first, then fill it
        # we prefix with "AP: " so the user knows which ones we made
        new_playlist = sp.user_playlist_create(
            user=user_id,
            name=f"AP: {name}",
            public=True,
            description="Created by AutoPlaylist"
        )
        playlist_id = new_playlist["id"]

        # Spotify only lets you add 100 tracks per request so we batch it
        track_uris = [f"spotify:track:{tid}" for tid in track_ids]
        for i in range(0, len(track_uris), 100):
            sp.playlist_add_items(playlist_id, track_uris[i:i+100])

        created.append({
            "name": name,
            "playlist_id": playlist_id,
            "track_count": len(track_ids)
        })

    return {"status": "ok", "created": created}
