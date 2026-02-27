import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

type SettingsModalKey = 'genre' | 'language' | 'artist' | null

export default function OptionsPage() {
  const navigate = useNavigate()
  const {
    selectedPlaylists, deselectPlaylist,
    enabledGenerators, toggleGenerator,
    generatorSettings, updateGeneratorSettings,
  } = useStore()

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState<SettingsModalKey>(null)

  const confirmDeselect = () => {
    if (confirmId) deselectPlaylist(confirmId)
    setConfirmId(null)
    if (selectedPlaylists.length <= 1) navigate('/playlists')
  }

  const anyEnabled = Object.values(enabledGenerators).some(Boolean)

  const handleGenerate = () => {
    navigate('/generating')
  }

  const generators = [
    {
      key: 'genre' as const,
      label: 'Genre',
      desc: 'Groups songs by genre like Pop, Rock, Jazz, etc.',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    },
    {
      key: 'language' as const,
      label: 'Language',
      desc: 'Detects the language of each song and creates language playlists.',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    },
    {
      key: 'artist' as const,
      label: 'Artist',
      desc: 'Creates a playlist for artists who appear frequently.',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    },
  ]

  return (
    <div className="op-root">
      {/* Header */}
      <header className="op-header">
        <div className="op-logo">
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#1DB954" strokeWidth="2" />
            <path d="M10 14h16M10 18h12M10 22h14" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>AutoPlaylist</span>
        </div>
        <div className="op-step">Step 2 of 4</div>
      </header>

      <main className="op-main">
        {/* Left — selected playlists */}
        <section className="op-left">
          <h2 className="op-title">Selected Playlists</h2>
          <p className="op-subtitle">These selected playlists will be analysed</p>

          <ul className="op-playlist-list">
            {selectedPlaylists.map((p) => (
              <li key={p.id} className="op-playlist-item">
                <div className="op-playlist-icon">
                  {p.type === 'liked' ? '♥' : '♪'}
                </div>
                <div className="op-playlist-info">
                  <span className="op-playlist-name">{p.name}</span>
                  <span className="op-playlist-count">{p.track_count} songs</span>
                </div>
                <button
                  className="op-playlist-remove"
                  onClick={() => setConfirmId(p.id)}
                  title="Remove"
                >✕</button>
              </li>
            ))}
          </ul>

          <button className="op-back-btn" onClick={() => navigate('/playlists')}>
            ← Add more playlists
          </button>
        </section>

        {/* Right — generator options */}
        <section className="op-right">
          <h2 className="op-title">Generation Options</h2>
          <p className="op-subtitle">Choose what kind of playlists you want to create</p>

          <div className="op-generators">
            {generators.map(({ key, label, desc, icon }) => {
              const enabled = enabledGenerators[key]
              return (
                <div key={key} className={`op-gen-card ${enabled ? 'op-gen-card--on' : ''}`}>
                  <div className="op-gen-top">
                    <div className="op-gen-left">
                      <span className="op-gen-icon" dangerouslySetInnerHTML={{ __html: icon }} />
                      <div>
                        <p className="op-gen-label">{label}-based</p>
                        <p className="op-gen-desc">{desc}</p>
                      </div>
                    </div>
                    <div className="op-gen-controls">
                      <button
                        className="op-settings-btn"
                        onClick={() => setOpenModal(key)}
                        title="Settings"
                      >⚙</button>
                      <button
                        className={`op-toggle ${enabled ? 'op-toggle--on' : ''}`}
                        onClick={() => toggleGenerator(key)}
                      >
                        <span className="op-toggle-knob" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Coming soon card */}
            <div className="op-gen-card op-gen-card--soon">
              <div className="op-gen-top">
                <div className="op-gen-left">
                  <span className="op-gen-icon" style={{ opacity: 0.4 }} dangerouslySetInnerHTML={{ __html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>` }} />
                  <div>
                    <p className="op-gen-label" style={{ opacity: 0.4 }}>TV / Anime-based</p>
                    <p className="op-gen-desc" style={{ opacity: 0.3 }}>Group songs by the show or game they're associated with.</p>
                  </div>
                </div>
                <span className="op-soon-badge">Soon</span>
              </div>
            </div>
          </div>

          <div className="op-actions">
            <button className="op-cancel-btn" onClick={() => navigate('/playlists')}>
              Cancel
            </button>
            <button
              className="op-generate-btn"
              disabled={!anyEnabled}
              onClick={handleGenerate}
            >
              Generate ✦
            </button>
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      {openModal && (
        <div className="op-overlay" onClick={() => setOpenModal(null)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="op-modal-title">
              {openModal === 'genre' && 'Genre Settings'}
              {openModal === 'language' && 'Language Settings'}
              {openModal === 'artist' && 'Artist Settings'}
            </h3>

            <div className="op-modal-field">
              <label>Allow duplicate songs across playlists</label>
              <button
                className={`op-toggle ${generatorSettings.allowDuplicates ? 'op-toggle--on' : ''}`}
                onClick={() => updateGeneratorSettings({ allowDuplicates: !generatorSettings.allowDuplicates })}
              >
                <span className="op-toggle-knob" />
              </button>
            </div>

            {openModal === 'genre' && (
              <div className="op-modal-field">
                <label>Max genre playlists to create</label>
                <input
                  type="number"
                  className="op-modal-input"
                  value={generatorSettings.maxGenres}
                  min={1} max={20}
                  onChange={(e) => updateGeneratorSettings({ maxGenres: Number(e.target.value) })}
                />
              </div>
            )}

            {openModal === 'language' && (
              <div className="op-modal-field">
                <label>Max language playlists to create</label>
                <input
                  type="number"
                  className="op-modal-input"
                  value={generatorSettings.maxLanguages}
                  min={1} max={20}
                  onChange={(e) => updateGeneratorSettings({ maxLanguages: Number(e.target.value) })}
                />
              </div>
            )}

            {openModal === 'artist' && (
              <>
                <div className="op-modal-field">
                  <label>Min song appearances to qualify</label>
                  <input
                    type="number"
                    className="op-modal-input"
                    value={generatorSettings.artistMinAppearances}
                    min={3} max={50}
                    onChange={(e) => updateGeneratorSettings({ artistMinAppearances: Number(e.target.value) })}
                  />
                </div>
                <div className="op-modal-field">
                  <label>Max artist playlists to create</label>
                  <input
                    type="number"
                    className="op-modal-input"
                    value={generatorSettings.maxArtists}
                    min={1} max={20}
                    onChange={(e) => updateGeneratorSettings({ maxArtists: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            <button className="op-modal-done" onClick={() => setOpenModal(null)}>Done</button>
          </div>
        </div>
      )}

      {/* Confirm deselect */}
      {confirmId && (
        <div className="op-overlay">
          <div className="op-modal">
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, lineHeight: 1.6 }}>
              Remove <strong>{selectedPlaylists.find(p => p.id === confirmId)?.name}</strong> from selection?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="op-cancel-btn" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Keep it</button>
              <button className="op-generate-btn" style={{ flex: 1, background: '#ff6b6b' }} onClick={confirmDeselect}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .op-root {
          min-height: 100vh;
          background: #080808;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .op-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .op-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem;
        }
        .op-step { font-size: 0.8rem; color: rgba(255,255,255,0.35); }

        .op-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: calc(100vh - 65px);
        }

        .op-left {
          padding: 36px 40px;
          border-right: 1px solid rgba(255,255,255,0.07);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .op-right {
          padding: 36px 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .op-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .op-subtitle {
          color: rgba(255,255,255,0.4);
          font-size: 0.875rem;
          margin-bottom: 24px;
        }

        .op-playlist-list { list-style: none; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .op-playlist-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: rgba(29,185,84,0.07);
          border: 1px solid rgba(29,185,84,0.18);
          border-radius: 12px;
        }
        .op-playlist-icon { color: #1DB954; font-size: 0.9rem; width: 20px; text-align: center; }
        .op-playlist-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .op-playlist-name { font-size: 0.9rem; font-weight: 500; }
        .op-playlist-count { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
        .op-playlist-remove {
          background: none; border: none; color: rgba(255,255,255,0.25);
          cursor: pointer; font-size: 0.75rem; padding: 4px; border-radius: 4px;
          transition: color 0.1s;
        }
        .op-playlist-remove:hover { color: #ff6b6b; }

        .op-back-btn {
          margin-top: 20px;
          background: none; border: none;
          color: rgba(255,255,255,0.35);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          text-align: left;
          transition: color 0.15s;
          padding: 0;
        }
        .op-back-btn:hover { color: #1DB954; }

        .op-generators { display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .op-gen-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 18px 20px;
          transition: border-color 0.2s, background 0.2s;
        }
        .op-gen-card--on {
          border-color: rgba(29,185,84,0.3);
          background: rgba(29,185,84,0.05);
        }
        .op-gen-card--soon { opacity: 0.5; }

        .op-gen-top { display: flex; align-items: center; justify-content: space-between; }
        .op-gen-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; }
        .op-gen-icon { display: flex; align-items: center; justify-content: center; margin-top: 7px; color: currentColor; }
        .op-gen-label { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
        .op-gen-desc { font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .op-gen-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: 16px; }

        .op-settings-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.25);
          font-size: 1rem; cursor: pointer;
          transition: color 0.15s;
          padding: 4px;
        }
        .op-settings-btn:hover { color: rgba(255,255,255,0.6); }

        .op-toggle {
          width: 44px; height: 24px;
          background: rgba(255,255,255,0.12);
          border: none; border-radius: 50px;
          cursor: pointer; position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .op-toggle--on { background: #1DB954; }
        .op-toggle-knob {
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
          display: block;
        }
        .op-toggle--on .op-toggle-knob { transform: translateX(20px); }

        .op-soon-badge {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 50px;
          letter-spacing: 0.5px;
        }

        .op-actions {
          display: flex; gap: 12px; margin-top: 24px;
        }
        .op-cancel-btn {
          flex: 1; padding: 13px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .op-cancel-btn:hover { background: rgba(255,255,255,0.1); }

        .op-generate-btn {
          flex: 2; padding: 13px;
          background: #1DB954;
          color: #000;
          border: none;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem; font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          box-shadow: 0 0 24px rgba(29,185,84,0.2);
        }
        .op-generate-btn:hover:not(:disabled) { background: #1ed760; transform: translateY(-1px); }
        .op-generate-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Modal */
        .op-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
        }
        .op-modal {
          background: #141414;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 36px;
          width: 90%; max-width: 380px;
          animation: fadeUp 0.2s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .op-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .op-modal-field {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }
        .op-modal-field label {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.65);
          flex: 1;
        }
        .op-modal-input {
          width: 64px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          padding: 8px 10px;
          text-align: center;
        }
        .op-modal-done {
          width: 100%;
          padding: 12px;
          background: #1DB954;
          color: #000;
          border: none;
          border-radius: 50px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s;
        }
        .op-modal-done:hover { background: #1ed760; }
      `}</style>
    </div>
  )
}
