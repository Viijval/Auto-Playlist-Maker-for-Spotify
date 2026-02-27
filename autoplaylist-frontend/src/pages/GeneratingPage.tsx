import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { apiFetch } from '../api'

const STEPS = [
  'Fetching tracks from selected playlists...',
  'Reading artist and genre data...',
  'Detecting languages...',
  'Grouping by genre...',
  'Grouping by artist...',
  'Doing crazy background research',
  'Finalising results...',
]

export default function GeneratingPage() {
  const navigate = useNavigate()
  const { selectedPlaylists, enabledGenerators, generatorSettings, setGeneratedResults } = useStore()

  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false) // prevents React StrictMode double-invocation

  useEffect(() => {
    // Guard against React StrictMode running effects twice in development
    if (hasRun.current) return
    hasRun.current = true

    // Cycle through status messages while waiting
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, 1800)

    const run = async () => {
      try {
        const res = await apiFetch('/generate', {
          method: 'POST',
          body: JSON.stringify({
            playlist_ids: selectedPlaylists.map((p) => p.id),
            options: {
              genre: enabledGenerators.genre,
              language: enabledGenerators.language,
              artist: enabledGenerators.artist,
              allow_duplicates: generatorSettings.allowDuplicates,
              artist_min_appearances: generatorSettings.artistMinAppearances,
              max_genres: generatorSettings.maxGenres,
              max_languages: generatorSettings.maxLanguages,
              max_artists: generatorSettings.maxArtists,
            },
          }),
        })

        if (!res.ok) throw new Error('Generation failed')
        const data = await res.json()

        setGeneratedResults(data.results, data.track_details || {})
        clearInterval(interval)
        navigate('/review')
      } catch (e: any) {
        clearInterval(interval)
        setError(e.message)
      }
    }

    run()
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="gen-root">
      <div className="gen-card">
        {error ? (
          <>
            <div className="gen-error-icon">✕</div>
            <h2 className="gen-title">Something went wrong</h2>
            <p className="gen-status" style={{ color: '#ff6b6b' }}>{error}</p>
            <button className="gen-retry-btn" onClick={() => navigate('/options')}>
              ← Go back
            </button>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div className="gen-spinner">
              <div className="gen-ring gen-ring-1" />
              <div className="gen-ring gen-ring-2" />
              <div className="gen-ring gen-ring-3" />
              <div className="gen-dot" />
            </div>

            <h2 className="gen-title">Generating your playlists</h2>
            <p className="gen-status">{STEPS[stepIndex]}</p>

            <div className="gen-progress">
              <div
                className="gen-progress-bar"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <p className="gen-note">
              Analysing{' '}
              <strong style={{ color: '#fff' }}>{selectedPlaylists.length}</strong>{' '}
              playlist{selectedPlaylists.length > 1 ? 's' : ''}. This may take a moment.
            </p>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .gen-root {
          min-height: 100vh;
          background: #080808;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
        }

        .gen-card {
          text-align: center;
          max-width: 440px;
          width: 90%;
          animation: fadeIn 0.5s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Spinner */
        .gen-spinner {
          width: 80px; height: 80px;
          position: relative;
          margin: 0 auto 36px;
        }
        .gen-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
        }
        .gen-ring-1 {
          border-top-color: #1DB954;
          animation: spin 1.2s linear infinite;
        }
        .gen-ring-2 {
          inset: 10px;
          border-right-color: rgba(29,185,84,0.5);
          animation: spin 1.8s linear infinite reverse;
        }
        .gen-ring-3 {
          inset: 20px;
          border-bottom-color: rgba(29,185,84,0.25);
          animation: spin 2.4s linear infinite;
        }
        .gen-dot {
          position: absolute;
          inset: 34px;
          background: #1DB954;
          border-radius: 50%;
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.6; }
          50%       { transform: scale(1.1); opacity: 1; }
        }

        .gen-error-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(255,107,107,0.15);
          border: 1px solid rgba(255,107,107,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
          color: #ff6b6b;
          margin: 0 auto 24px;
        }

        .gen-title {
           font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }

        .gen-status {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          min-height: 20px;
          transition: opacity 0.3s;
        }

        .gen-progress {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .gen-progress-bar {
          height: 100%;
          background: #1DB954;
          border-radius: 2px;
          transition: width 1.6s ease;
          box-shadow: 0 0 8px rgba(29,185,84,0.5);
        }

        .gen-note {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.25);
        }

        .gen-retry-btn {
          margin-top: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          border-radius: 50px;
          padding: 10px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gen-retry-btn:hover { background: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  )
}
