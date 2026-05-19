// App.jsx est le composant racine : il contient le layout global
// (sidebar + zone de contenu) et gère l'état de l'utilisateur connecté.
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Pioche from './pages/Pioche'
import Bibliotheque from './pages/Bibliotheque'

export default function App() {
  // "page" contrôle quelle page est affichée (pas besoin de react-router pour si peu de pages)
  const [page, setPage] = useState('Pioche')
  const [user, setUser] = useState(null)

  // Au démarrage, on vérifie si une session Supabase existe déjà
  // (l'utilisateur avait peut-être fermé le navigateur sans se déconnecter)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // onAuthStateChange : Supabase nous notifie automatiquement
    // quand l'état de connexion change (login, logout, expiration de token).
    // C'est l'équivalent du "restore session" de Streamlit mais en temps réel.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // La fonction retournée par useEffect est appelée au "démontage" du composant.
    // On retire l'écouteur pour éviter les fuites mémoire.
    return () => listener.subscription.unsubscribe()
  }, [])  // [] = exécuté une seule fois au montage (comme un __init__)

  return (
    <div style={styles.appLayout}>
      {/* ===== SIDEBAR ===== */}
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>✦ Skymap</h1>

        {/* Navigation */}
        <nav style={styles.nav}>
          {['Pioche', 'Bibliothèque'].map(p => (
            <button
              key={p}
              style={{
                ...styles.navBtn,
                // Ternaire JS : condition ? siVrai : siFaux
                // Équivalent Python : styles.navBtnActive if page === p else {}
                ...(page === p.replace('è', 'e') || (p === 'Bibliothèque' && page === 'Bibliotheque')
                  ? styles.navBtnActive : {})
              }}
              onClick={() => setPage(p === 'Bibliothèque' ? 'Bibliotheque' : p)}
            >
              {p === 'Pioche' ? '🎴 ' : '📚 '}{p}
            </button>
          ))}
        </nav>

        <div style={styles.divider} />

        {/* Auth : on passe user et la fonction de mise à jour */}
        <Auth user={user} onAuthChange={setUser} />
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main style={styles.main}>
        <h2 style={styles.pageTitle}>{page === 'Pioche' ? '🎴 Pioche' : '📚 Bibliothèque'}</h2>

        {/* Rendu conditionnel : affiche la page correspondante */}
        {page === 'Pioche'
          ? <Pioche user={user} />
          : <Bibliotheque user={user} />
        }
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
