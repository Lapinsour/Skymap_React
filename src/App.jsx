import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Pioche from './pages/Pioche'
import Bibliotheque from './pages/Bibliotheque'
import Skymap from './pages/Skymap'

const PAGES = [
  { id: 'Pioche', label: '🎴 Pioche' },
  { id: 'Bibliotheque', label: '📚 Bibliothèque' },
  { id: 'Skymap', label: '🌌 Skymap' },
]

export default function App() {
  const [page, setPage] = useState('Pioche')
  const [user, setUser] = useState(null)

  // 👇 état du menu
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const currentPage = PAGES.find(p => p.id === page)

  const handlePageChange = (newPage) => {
    setPage(newPage)

    // 👇 ferme automatiquement le menu sur mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div style={styles.appLayout}>
      {/* ===== BOUTON MOBILE ===== */}
      <button
        style={styles.mobileMenuBtn}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* ===== OVERLAY MOBILE ===== */}
      {sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpen : {}),
        }}
      >
        <h1 style={styles.logo}>✦ Skymap</h1>

        <nav style={styles.nav}>
          {PAGES.map(p => (
            <button
              key={p.id}
              style={{
                ...styles.navBtn,
                ...(page === p.id ? styles.navBtnActive : {}),
              }}
              onClick={() => handlePageChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div style={styles.divider} />

        <Auth user={user} onAuthChange={setUser} />
      </aside>

      {/* ===== CONTENU ===== */}
      <main style={styles.main}>
        <h2 style={styles.pageTitle}>{currentPage?.label}</h2>

        {page === 'Pioche' && <Pioche user={user} />}
        {page === 'Bibliotheque' && <Bibliotheque user={user} />}
        {page === 'Skymap' && <Skymap user={user} />}
      </main>
    </div>
  )
}

const styles = {
  appLayout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0d0d0d',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    position: 'relative',
  },

  mobileMenuBtn: {
    position: 'fixed',
    top: 16,
    left: 16,
    zIndex: 2000,
    background: '#222',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    width: 42,
    height: 42,
    fontSize: '1.2rem',
    cursor: 'pointer',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },

  sidebar: {
    width: 240,
    background: '#111',
    borderRight: '1px solid #222',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,

    // 👇 comportement mobile
    position: 'fixed',
    top: 0,
    left: '-280px',
    bottom: 0,
    zIndex: 1000,

    transition: 'left 0.25s ease',
  },

  sidebarOpen: {
    left: 0,
  },

  logo: {
    fontSize: '1.3rem',
    fontWeight: 800,
    marginBottom: 20,
    color: '#fff',
    marginTop: 40,
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  navBtn: {
    padding: '9px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#888',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background 0.15s, color 0.15s',
  },

  navBtnActive: {
    background: '#222',
    color: '#fff',
    fontWeight: 600,
  },

  divider: {
    height: 1,
    background: '#222',
    margin: '16px 0',
  },

  main: {
    flex: 1,
    padding: '72px 20px 32px',
    overflowY: 'auto',
    width: '100%',
  },

  pageTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    marginBottom: 28,
  },
}
