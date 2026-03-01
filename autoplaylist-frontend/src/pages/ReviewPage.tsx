import { useStore, type GeneratedResults } from '../store'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

interface PlaylistEntry {
  name: string
  trackIds: string[]
  type: 'genre' | 'language' | 'artist'
  selected: boolean
}

function buildEntries(results: GeneratedResults): PlaylistEntry[] {
  const entries: PlaylistEntry[] = []
  Object.entries(results.genre || {}).forEach(([name, ids]) => {
    entries.push({ name, trackIds: ids, type: 'genre', selected: true })
  })
  Object.entries(results.language || {}).forEach(([name, ids]) => {
    entries.push({ name, trackIds: ids, type: 'language', selected: true })
  })
  Object.entries(results.artist || {}).forEach(([name, ids]) => {
    entries.push({ name, trackIds: ids, type: 'artist', selected: true })
  })
  return entries
}

const TYPE_LABELS = {
  genre:    { label: 'By Genre',    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`, color: 'rgb(255, 157, 221)' },
  language: { label: 'By Language', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`, color: '#60a5fa' },
  artist:   { label: 'By Artist',   icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, color: '#f472b6' },
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const generatedResults = useStore((state) => state.generatedResults)
  const trackDetails = useStore((state) => state.trackDetails)
  const logout = useStore((state) => state.logout)

  const [entries, setEntries] = useState<PlaylistEntry[]>(
    generatedResults ? buildEntries(generatedResults) : []
  )
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const toggle = (idx: number) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, selected: !e.selected } : e))
  }

  const toggleExpand = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation() // don't trigger the select toggle
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  const selected = entries.filter((e) => e.selected)

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await apiFetch('/create-playlists', {
        method: 'POST',
        body: JSON.stringify({
          playlists: selected.map((e) => ({
            name: e.name,
            track_ids: e.trackIds,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to create playlists')
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const byType = (['genre', 'language', 'artist'] as const).map((type) => ({
    type,
    entries: entries.map((e, i) => ({ ...e, idx: i })).filter((e) => e.type === type),
  })).filter((g) => g.entries.length > 0)

  if (done) {
    return (
      <div className="rv-root rv-done-root">
        <div className="rv-done-card">
          <div className="rv-done-icon">✓</div>
          <h2 className="rv-done-title">Playlists Created!</h2>
          <p className="rv-done-sub">
            {selected.length} playlist{selected.length > 1 ? 's' : ''} have been added to your Spotify account.
          </p>
          <button className="rv-start-over" onClick={() => { logout(); navigate('/') }}>
            Start over
          </button>
        </div>
        <style>{sharedStyles}</style>
      </div>
    )
  }

  return (
    <div className="rv-root">
      <header className="rv-header">
        <div className="rv-logo">
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#1DB954" strokeWidth="2" />
            <path d="M10 14h16M10 18h12M10 22h14" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>AutoPlaylist</span>
        </div>
        <div className="rv-step">Step 4 of 4</div>
      </header>

      <main className="rv-main">
        <div className="rv-top">
          <div>
            <h2 className="rv-title">Your Generated Playlists</h2>
            <p className="rv-subtitle">Select which ones to add to your Spotify account</p>
          </div>
          <div className="rv-summary">
            <span className="rv-summary-count">{selected.length}</span>
            <span className="rv-summary-label">selected</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rv-empty">
            <p>No playlists were generated. Try adjusting your options.</p>
            <button className="rv-back-btn" onClick={() => navigate('/options')}>← Back to options</button>
          </div>
        ) : (
          <div className="rv-sections">
            {byType.map(({ type, entries: group }) => {
              const meta = TYPE_LABELS[type]
              return (
                <div key={type} className="rv-section">
                  <h3 className="rv-section-title">
                    <span className="rv-section-icon" dangerouslySetInnerHTML={{ __html: meta.icon }} />
                    {meta.label}
                    <span className="rv-section-badge" style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                      {group.length}
                    </span>
                  </h3>

                  <div className="rv-grid">
                    {group.map(({ idx, name, trackIds, selected: sel }) => {
                      const isExpanded = expandedIdx === idx
                      return (
                        <div
                          key={idx}
                          className={`rv-card ${sel ? 'rv-card--selected' : ''} ${isExpanded ? 'rv-card--expanded' : ''}`}
                          style={sel ? { borderColor: `${meta.color}40`, background: `${meta.color}08` } : {}}
                        >
                          {/* Card header row — clicking this toggles selection */}
                          <div className="rv-card-row" onClick={() => toggle(idx)}>
                            <div className="rv-card-check" style={sel ? { background: meta.color, borderColor: meta.color } : {}}>
                              {sel && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="rv-card-info">
                              <p className="rv-card-name">{name}</p>
                              <p className="rv-card-count">{trackIds.length} songs</p>
                            </div>
                            {/* Preview toggle button */}
                            <button
                              className="rv-preview-btn"
                              onClick={(e) => toggleExpand(e, idx)}
                              title={isExpanded ? 'Hide songs' : 'Preview songs'}
                            >
                              <svg
                                width="14" height="14" viewBox="0 0 12 12" fill="none"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                              >
                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>

                          {/* Expandable song list */}
                          {isExpanded && (
                            <div className="rv-preview">
                              <div className="rv-preview-inner">
                                {trackIds.slice(0, 50).map((tid, i) => {
                                  const detail = trackDetails[tid]
                                  return (
                                    <div key={tid} className="rv-song-row">
                                      <span className="rv-song-num">{i + 1}</span>
                                      <div className="rv-song-info">
                                        <span className="rv-song-name">
                                          {detail ? detail.name : tid}
                                        </span>
                                        {detail && (
                                          <span className="rv-song-artist">{detail.artists}</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                                {trackIds.length > 50 && (
                                  <p className="rv-preview-more">
                                    +{trackIds.length - 50} more songs
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="rv-error">⚠ {error}</p>}

        <div className="rv-footer">
          <button className="rv-cancel-btn" onClick={() => navigate('/options')}>
            ← Change options
          </button>
          <button
            className="rv-create-btn"
            disabled={selected.length === 0 || creating}
            onClick={handleCreate}
          >
            {creating ? 'Creating...' : `Create ${selected.length} Playlist${selected.length !== 1 ? 's' : ''} on Spotify`}
          </button>
        </div>
      </main>

      <style>{sharedStyles}</style>
    </div>
  )
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .rv-root {
    min-height: 100vh;
    background: #080808;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .rv-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 40px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .rv-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem;
  }
  .rv-step { font-size: 0.8rem; color: rgba(255,255,255,0.35); }

  .rv-main {
    flex: 1;
    padding: 36px 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
  }

  .rv-top {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 32px;
  }
  .rv-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem; font-weight: 800;
    margin-bottom: 6px;
  }
  .rv-subtitle { color: rgba(255,255,255,0.4); font-size: 0.875rem; }
  .rv-summary {
    text-align: right;
    display: flex; flex-direction: column; align-items: flex-end;
  }
  .rv-summary-count {
    font-family: 'Syne', sans-serif;
    font-size: 2rem; font-weight: 800; color: rgb(255, 156, 239); line-height: 1;
  }
  .rv-summary-label { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 2px; }

  .rv-sections { display: flex; flex-direction: column; gap: 32px; flex: 1; }

  .rv-section-title {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem; font-weight: 700;
    margin-bottom: 14px;
  }
  .rv-section-icon { display: flex; align-items: center; }
  .rv-section-badge {
    font-size: 0.7rem; font-weight: 600;
    padding: 3px 8px; border-radius: 50px;
    margin-left: 4px;
  }

  .rv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }

  /* Card */
  .rv-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.15s, background 0.15s;
  }
  .rv-card:hover { background: rgba(255,255,255,0.05); }
  .rv-card--expanded { grid-column: span 2; }

  .rv-card-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
  }

  .rv-card-check {
    width: 20px; height: 20px; flex-shrink: 0;
    border-radius: 6px;
    border: 1.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
  }

  .rv-card-info { flex: 1; min-width: 0; }
  .rv-card-name {
    font-size: 0.875rem; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .rv-card-count { font-size: 0.72rem; color: rgba(255,255,255,0.35); }

  .rv-preview-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
  }
  .rv-preview-btn:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.06);
  }

  /* Song preview panel */
  .rv-preview {
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.2);
  }
  .rv-preview-inner {
    max-height: 220px;
    overflow-y: auto;
    padding: 8px 0;
  }
  .rv-preview-inner::-webkit-scrollbar { width: 4px; }
  .rv-preview-inner::-webkit-scrollbar-track { background: transparent; }
  .rv-preview-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

  .rv-song-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 16px;
    transition: background 0.1s;
  }
  .rv-song-row:hover { background: rgba(255,255,255,0.04); }

  .rv-song-num {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.2);
    width: 18px;
    text-align: right;
    flex-shrink: 0;
  }
  .rv-song-info { flex: 1; min-width: 0; }
  .rv-song-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255,255,255,0.8);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
  .rv-song-artist {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
  .rv-preview-more {
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.25);
    padding: 8px 16px;
  }

  .rv-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; text-align: center;
    color: rgba(255,255,255,0.3);
  }
  .rv-error { color: #ff6b6b; font-size: 0.875rem; margin-top: 12px; }

  .rv-footer {
    display: flex; gap: 12px;
    padding-top: 28px; margin-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .rv-cancel-btn {
    padding: 13px 24px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; cursor: pointer;
    transition: background 0.15s;
  }
  .rv-cancel-btn:hover { background: rgba(255,255,255,0.09); }
  .rv-back-btn {
    background: none; border: none;
    color: rgba(255,255,255,0.4);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; cursor: pointer;
  }
  .rv-create-btn {
    flex: 1; padding: 13px 28px;
    background: #1DB954; color: #000;
    border: none; border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 700; cursor: pointer;
    transition: background 0.15s, transform 0.1s, opacity 0.15s;
    box-shadow: 0 0 24px rgba(29,185,84,0.2);
  }
  .rv-create-btn:hover:not(:disabled) { background: #1ed760; transform: translateY(-1px); }
  .rv-create-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Done state */
  .rv-done-root { align-items: center; justify-content: center; }
  .rv-done-card {
    text-align: center; max-width: 400px; width: 90%;
    animation: fadeUp 0.5s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rv-done-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(29,185,84,0.12);
    border: 1px solid rgba(29,185,84,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; color: #1DB954;
    margin: 0 auto 28px;
  }
  .rv-done-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem; font-weight: 800; margin-bottom: 12px;
  }
  .rv-done-sub {
    color: rgba(255,255,255,0.45);
    font-size: 0.9rem; line-height: 1.7; margin-bottom: 32px;
  }
  .rv-start-over {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.7);
    border-radius: 50px; padding: 12px 28px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600; font-size: 0.875rem; cursor: pointer;
    transition: background 0.15s;
  }
  .rv-start-over:hover { background: rgba(255,255,255,0.11); }

  @media (max-width: 640px) {
    .rv-header { padding: 16px 20px; }
    .rv-main { padding: 24px 20px; }
    .rv-title { font-size: 1.3rem; }
    .rv-grid { grid-template-columns: 1fr; }
    .rv-card--expanded { grid-column: span 1; }
    .rv-footer {
      flex-direction: column;
      gap: 10px;
      padding-top: 20px;
    }
    .rv-cancel-btn { width: 100%; text-align: center; }
    .rv-create-btn { width: 100%; }
    .rv-summary-count { font-size: 1.5rem; }
  }
`
