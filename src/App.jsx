import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Pioche from './pages/Pioche'
import Bibliotheque from './pages/Bibliotheque'
import Skymap from './pages/Skymap'   // ← nouveau

// Les pages de l'app — on les déclare ici pour pouvoir itérer dessus
const PAGES = [
  { id: 'Pioche',       label: '🎴 Pioche' },
  { id: 'Bibliotheque', label: '📚 Bibliothèque' },
  { id: 'Skymap',       label: '🌌 Skymap' },   // ← nouveau
]

export default function App() {
  const [page, setPage] = useState('Pioche')
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const currentPage = PAGES.find(p => p.id === page)

  return (
    <div style={styles.appLayout}>
      {/* ===== SIDEBAR ===== */}
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>✦ Skymap</h1>

        <nav style={styles.nav}>
          {PAGES.map(p => (
            <button
              key={p.id}
              style={{
                ...styles.navBtn,
                ...(page === p.id ? styles.navBtnActive : {}),
              }}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div style={styles.divider} />

        <Auth user={user} onAuthChange={setUser} />
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main style={styles.main}>
        <h2 style={styles.pageTitle}>{currentPage?.label}</h2>

        {page === 'Pioche'       && <Pioche       user={user} />}
        {page === 'Bibliotheque' && <Bibliotheque user={user} />}
        {page === 'Skymap'       && <Skymap       user={user} />}
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
  },
  logo: { fontSize: '1.3rem', fontWeight: 800, marginBottom: 20, color: '#fff' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: {
    padding: '9px 14px', borderRadius: 8, border: 'none',
    background: 'transparent', color: '#888',
    textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
    transition: 'background 0.15s, color 0.15s',
  },
  navBtnActive: { background: '#222', color: '#fff', fontWeight: 600 },
  divider: { height: 1, background: '#222', margin: '16px 0' },
  main: { flex: 1, padding: '32px 36px', overflowY: 'auto' },
  pageTitle: { fontSize: '1.6rem', fontWeight: 700, marginBottom: 28 },
}
