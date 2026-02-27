import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────── DESCRIBES SHAPE OF DATA

export interface Playlist {
  id: string
  name: string
  track_count: number
  type: 'liked' | 'playlist'
}

export interface Track {
  track_id: string
  name: string
  artists: { id: string; name: string }[]
  album: string
  release_date: string
  playlist_source: string
}

export interface GeneratorSettings {
  allowDuplicates: boolean
  artistMinAppearances: number  // default 5, min 3
  maxLanguages: number          // default 3
  maxGenres: number             // default 3
  maxArtists: number            // default 5
}

export interface EnabledGenerators {
  genre: boolean
  language: boolean
  artist: boolean
}

export interface TrackDetail {
  name: string
  artists: string
}

// GeneratedResults maps each type to a record of name → list of track IDs
export interface GeneratedResults {
  genre: Record<string, string[]>
  language: Record<string, string[]>
  artist: Record<string, string[]>
}

// ─── Store shape ────────────────────────────────────────────────────────────── SO THAT TYPESCRIPT CAN SEE WHAT USESTORE CONTAINS, STATES AND ACTIONS. basically for variables.

interface AppState {
  // Auth
  accessToken: string | null
  refreshToken: string | null
  setAccessToken: (token: string) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void

  // All playlists fetched from Spotify
  allPlaylists: Playlist[]
  setAllPlaylists: (playlists: Playlist[]) => void

  // Playlists the user has selected on Page 1
  selectedPlaylists: Playlist[]
  selectPlaylist: (playlist: Playlist) => void
  deselectPlaylist: (id: string) => void

  // Generator toggles (which types are enabled)
  enabledGenerators: EnabledGenerators
  toggleGenerator: (key: keyof EnabledGenerators) => void

  // Generator settings (limits, duplicates, etc.)
  generatorSettings: GeneratorSettings
  updateGeneratorSettings: (partial: Partial<GeneratorSettings>) => void

  // Results that came back from /generate
  generatedResults: GeneratedResults | null
  trackDetails: Record<string, TrackDetail>
  setGeneratedResults: (results: GeneratedResults, details: Record<string, TrackDetail>) => void
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: GeneratorSettings = {
  allowDuplicates: false,
  artistMinAppearances: 5,
  maxLanguages: 3,
  maxGenres: 3,
  maxArtists: 5,
}

const DEFAULT_GENERATORS: EnabledGenerators = {
  genre: true,
  language: true,
  artist: true,
}

// ─── Store ──────────────────────────────────────────────────────────────────── actually creates your store.

export const useStore = create<AppState>((set) => ({
  // ── Auth ──
  accessToken: null,
  refreshToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
  logout: () => set({
    accessToken: null,
    refreshToken: null,
    allPlaylists: [],
    selectedPlaylists: [],
    generatedResults: null,
    trackDetails: {},
  }),

  // ── Playlists ──
  allPlaylists: [],
  setAllPlaylists: (playlists) => set({ allPlaylists: playlists }),

  // ── Selected Playlists ──
  selectedPlaylists: [],
  selectPlaylist: (playlist) =>
    set((state) => ({
      selectedPlaylists: state.selectedPlaylists.find((p) => p.id === playlist.id)
        ? state.selectedPlaylists  // already selected, don't add twice
        : [...state.selectedPlaylists, playlist],
    })),
  deselectPlaylist: (id) =>
    set((state) => ({
      selectedPlaylists: state.selectedPlaylists.filter((p) => p.id !== id),
    })),

  // ── Generators ──
  enabledGenerators: DEFAULT_GENERATORS,
  toggleGenerator: (key) =>
    set((state) => ({
      enabledGenerators: {
        ...state.enabledGenerators,
        [key]: !state.enabledGenerators[key],
      },
    })),

  // ── Settings ──
  generatorSettings: DEFAULT_SETTINGS,
  updateGeneratorSettings: (partial) =>
    set((state) => ({
      generatorSettings: { ...state.generatorSettings, ...partial },
    })),

  // ── Results ──
  generatedResults: null,
  trackDetails: {},
  setGeneratedResults: (results, details) => set({ generatedResults: results, trackDetails: details }),
}))
