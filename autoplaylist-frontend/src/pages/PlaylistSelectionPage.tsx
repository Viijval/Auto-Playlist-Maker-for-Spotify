import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { Playlist } from '../store'
import { apiFetch } from '../api'

export default function PlaylistSelectionPage() {
  // main function of this page, fetches playlists from backend when page load > displays on left to see , zustand useStore to track selected, lets you continue onto /options 
  const navigate = useNavigate()
  const { allPlaylists, setAllPlaylists, selectedPlaylists, selectPlaylist, deselectPlaylist } = useStore()
  /*
allPlaylists      — the full list of playlists fetched from the backend
setAllPlaylists   — action to save that fetched list into the store
selectedPlaylists — the playlists the user has checked/selected
selectPlaylist    — action to add a playlist to the selected list
deselectPlaylist  — action to remove a playlist from the selected list

All of these are defined in store/index.ts. The component just pulls them out here so it can use and update them throughout the page.
*/
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null) // id of playlist pending deselect

  // Fetch playlists from backend on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await apiFetch('/playlists')
        if (!res.ok) throw new Error('Failed to fetch playlists')
        const data: Playlist[] = await res.json()
        setAllPlaylists(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPlaylists()
  }, [])

  const isSelected = (id: string) => selectedPlaylists.some((p) => p.id === id)

  const handleToggle = (playlist: Playlist) => {
    if (isSelected(playlist.id)) {
      // Ask for confirmation before deselecting
      setConfirmId(playlist.id)
    } else {
      selectPlaylist(playlist)
    }
  }

  const confirmDeselect = () => {
    if (confirmId) deselectPlaylist(confirmId)
    setConfirmId(null)
  }

  return (
    <div className="ps-root">
      {/* Header */}
      <header className="ps-header">
        <div className="ps-logo">
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#1DB954" strokeWidth="2" />
            <path d="M10 14h16M10 18h12M10 22h14" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>AutoPlaylist</span>
        </div>
        <div className="ps-step">Step 1 of 4</div>
      </header>

      <main className="ps-main">
        {/* Left side  playlist list */}
        <section className="ps-left">
          <h2 className="ps-title">Your Library</h2>
          <p className="ps-subtitle">Pick playlists for generation.</p>

          {loading && (
            <div className="ps-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}

          {error && <p className="ps-error">⚠ {error}</p>}

          {!loading && !error && (
            <ul className="ps-list">
              {allPlaylists.map((playlist) => {
                const selected = isSelected(playlist.id)
                return (
                  <li
                    key={playlist.id}
                    className={`ps-item ${selected ? 'ps-item--selected' : ''}`}
                    onClick={() => handleToggle(playlist)}
                  >
                    <div className="ps-item-check">
                      {selected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="ps-item-icon">
                      {playlist.type === 'liked' ? '♥' : '♪'}
                    </div>
                    <div className="ps-item-info">
                      <span className="ps-item-name">{playlist.name}</span>
                      <span className="ps-item-count">{playlist.track_count} songs</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Right side selected summary */}
        <section className="ps-right">
          <div className="ps-panel">
            <h3 className="ps-panel-title">Selected</h3>

            {selectedPlaylists.length === 0 ? (
              <p className="ps-panel-empty">No playlists selected yet.<br />Pick at least one from the left.</p>
            ) : (
              <ul className="ps-selected-list">
                {selectedPlaylists.map((p) => (
                  <li key={p.id} className="ps-selected-item">
                    <span className="ps-selected-name">{p.name}</span>
                    <button
                      className="ps-selected-remove"
                      onClick={() => setConfirmId(p.id)}
                      title="Remove"
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="ps-panel-footer">
              <p className="ps-count-label">
                {selectedPlaylists.length === 0
                  ? 'Select at least 1 playlist'
                  : `${selectedPlaylists.length} playlist${selectedPlaylists.length > 1 ? 's' : ''} selected`}
              </p>
              <button
                className="ps-continue-btn"
                disabled={selectedPlaylists.length === 0}
                onClick={() => navigate('/options')}
              >
                Continue →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Confirm deselect dialog */}
      {confirmId && (
        <div className="ps-overlay">
          <div className="ps-dialog">
            <p className="ps-dialog-text">
              Remove <strong>{allPlaylists.find(p => p.id === confirmId)?.name}</strong> from selection?
            </p>
            <div className="ps-dialog-btns">
              <button className="ps-dialog-cancel" onClick={() => setConfirmId(null)}>Keep it</button>
              <button className="ps-dialog-confirm" onClick={confirmDeselect}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ps-root {
          min-height: 100vh;
          background: #080808;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .ps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ps-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: #fff;
        }
        .ps-step {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.5px;
        }

        .ps-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 0;
          height: calc(100vh - 65px);
        }

        @media (max-width: 640px) {
          .ps-header { padding: 16px 20px; }
          .ps-main {
            grid-template-columns: 1fr;
            height: auto;
            overflow-y: auto;
          }
          .ps-left {
            padding: 24px 20px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .ps-right {
            padding: 24px 20px;
          }
          .ps-panel {
            min-height: auto;
          }
          .ps-title { font-size: 1.5rem; }
        }

        /* Left */
        .ps-left {
          padding: 36px 40px;
          overflow-y: auto;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .ps-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .ps-subtitle {
          color: rgba(255,255,255,0.4);
          font-size: 0.875rem;
          margin-bottom: 28px;
        }

        .ps-loading { display: flex; flex-direction: column; gap: 10px; }
        .skeleton-row {
          height: 58px;
          border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        .ps-error { color: #ff6b6b; font-size: 0.875rem; }

        .ps-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .ps-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          background: rgba(255,255,255,0.02);
        }
        .ps-item:hover { background: rgba(255,255,255,0.06); }
        .ps-item--selected {
          border-color: #1DB954;
          background: rgba(29,185,84,0.08);
        }

        .ps-item-check {
          width: 20px; height: 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .ps-item--selected .ps-item-check {
          background: #1DB954;
          border-color: #1DB954;
        }

        .ps-item-icon {
          font-size: 1rem;
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }
        .ps-item--selected .ps-item-icon { color: #1DB954; }

        .ps-item-info { display: flex; flex-direction: column; gap: 2px; }
        .ps-item-name { font-size: 0.9rem; font-weight: 500; }
        .ps-item-count { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

        /* Right */
        .ps-right {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
        }
        .ps-panel {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ps-panel-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 1.25px;
          font-size: 0.75rem;
        }
        .ps-panel-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(255,255,255,0.2);
          font-size: 0.875rem;
          line-height: 1.7;
        }

        .ps-selected-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          overflow-y: auto;
        }
        .ps-selected-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(29,185,84,0.08);
          border: 1px solid rgba(29,185,84,0.2);
          border-radius: 10px;
          font-size: 0.875rem;
        }
        .ps-selected-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 8px;
        }
        .ps-selected-remove {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.1s;
          flex-shrink: 0;
        }
        .ps-selected-remove:hover { color: #ff6b6b; }

        .ps-panel-footer { margin-top: 20px; }
        .ps-count-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          margin-bottom: 12px;
          text-align: center;
        }
        .ps-continue-btn {
          width: 100%;
          padding: 14px;
          background: #1DB954;
          color: #000;
          border: none;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
        }
        .ps-continue-btn:hover:not(:disabled) {
          background: #1ed760;
          transform: translateY(-1px);
        }
        .ps-continue-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Confirm dialog */
        .ps-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
        }
        .ps-dialog {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 32px;
          max-width: 340px;
          width: 90%;
          text-align: center;
          animation: fadeUp 0.2s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ps-dialog-text {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .ps-dialog-btns { display: flex; gap: 12px; }
        .ps-dialog-cancel, .ps-dialog-confirm {
          flex: 1;
          padding: 12px;
          border-radius: 50px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .ps-dialog-cancel {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .ps-dialog-cancel:hover { background: rgba(255,255,255,0.12); }
        .ps-dialog-confirm {
          background: #ff6b6b;
          color: #fff;
        }
        .ps-dialog-confirm:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
