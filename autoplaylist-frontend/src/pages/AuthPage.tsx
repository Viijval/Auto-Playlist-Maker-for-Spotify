export default function AuthPage() {
  const handleLogin = () => {
    //window.location.href = 'http://127.0.0.1:8888/login'
    window.location.href = 'https://auto-playlist-maker-for-spotify-production.up.railway.app/login'
  }
/*This is the first page, it fetches tokens and login data for backend and redirects to playlist selection page. */
  return (
    <div className="auth-root">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-card">
        {/* Logo mark */}
        <div className="logo-mark">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#1DB954" strokeWidth="2" />
            <path d="M10 14h16M10 18h12M10 22h14" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="auth-title">AutoPlaylist</h1>
        <p className="auth-sub">
          Analyse your Spotify library and generate
          playlists based genre, language, and artist.
        </p>

        <button className="login-btn" onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Continue with Spotify
        </button>

        <p className="auth-note">
          We only read your playlists and create new ones.<br />We never modify or delete anything.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .auth-root {
          min-height: 100vh;
          background: #080808;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: #1DB954;
          top: -120px; left: -150px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: #0d6e34;
          bottom: -100px; right: -100px;
          animation-delay: -4s;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: #1DB954;
          top: 30%; right: 20%;
          animation-delay: -8s;
          opacity: 0.08;
        }
        @keyframes drift {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(100px, 80px) scale(1.1); }
        }

        .auth-card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 48px 56px;
          max-width: 520px;
          max-height: 420px;
          width: 90%;
          text-align: center;
          animation: fadeUp 0.7s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-mark {
          display: inline-flex;
          margin-bottom: 20px;
        }

        .auth-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 2.5em;
          color: #fff;
          letter-spacing: 2.5px;          
          margin: 0 0 12px;
        }

        .auth-sub {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          margin: 0 0 36px;
          font-weight: 300;
          max-width: 500px;
          max-width: 100%;
          text-wrap: unset;
        }

        .login-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #1DB954;
          color: #000;
          border: none;
          border-radius: 50px;
          padding: 14px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 0 32px rgba(29,185,84,0.25);
          letter-spacing: 0.3px;
        }
        .login-btn:hover {
          background: #1ed760;
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(29,185,84,0.4);
        }
        .login-btn:active {
          transform: translateY(0);
        }

        .auth-note {
          margin-top: 28px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
          line-height: 1.7;
        }
      `}</style>
    </div>
  )
}
