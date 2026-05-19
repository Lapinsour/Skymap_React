// useState : permet de stocker des valeurs qui, quand elles changent,
// déclenchent un re-rendu de l'interface. C'est l'équivalent des
// variables dans st.session_state de Streamlit.
import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Un composant React = une fonction qui reçoit des "props" (arguments)
// et retourne du JSX (du HTML enrichi).
// Ici, on reçoit "user" (l'utilisateur connecté ou null) et
// "onAuthChange" (une fonction à appeler quand l'état de connexion change).
export default function Auth({ user, onAuthChange }) {
  // useState('') crée une variable "email" initialisée à ''
  // et une fonction "setEmail" pour la modifier.
  // À chaque appel de setEmail(), React re-rend le composant.
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [message, setMessage]   = useState(null)

  // Fonction de connexion — équivalent de ton bouton "Connexion" Streamlit
  async function handleLogin() {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    onAuthChange(data.user)  // on remonte l'utilisateur au composant parent
  }

  // Fonction d'inscription
  async function handleSignup() {
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return setError(error.message)
    setMessage('Compte créé. Vérifie tes emails.')
  }

  // Fonction de déconnexion
  async function handleLogout() {
    await supabase.auth.signOut()
    onAuthChange(null)
  }

  // Si l'utilisateur est déjà connecté, on affiche son email + bouton déconnexion
  if (user) {
    return (
      <div style={styles.loggedIn}>
        <span style={styles.userEmail}>✦ {user.email}</span>
        <button style={styles.btnLogout} onClick={handleLogout}>Déconnexion</button>
      </div>
    )
  }

  // Sinon, on affiche le formulaire de connexion / inscription
  // Note JSX : on écrit "className" au lieu de "class" (mot réservé en JS)
  // et "onChange={...}" au lieu de "oninput"
  return (
    <div style={styles.form}>
      <input
        style={styles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}  // e.target.value = valeur saisie
      />
      <input
        style={styles.input}
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div style={styles.btnRow}>
        <button style={styles.btn} onClick={handleLogin}>Connexion</button>
        <button style={{...styles.btn, ...styles.btnSecondary}} onClick={handleSignup}>
          Créer un compte
        </button>
      </div>
      {/* Affichage conditionnel : si error est non-null, on affiche le message */}
      {error   && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.success}>{message}</p>}
    </div>
  )
}

// Les styles sont des objets JS (camelCase au lieu de kebab-case)
// C'est l'équivalent du CSS inline, pratique pour des composants isolés.
const styles = {
  form:      { display: 'flex', flexDirection: 'column', gap: 10 },
  input:     { padding: '8px 12px', borderRadius: 8, border: '1px solid #333',
               background: '#1a1a1a', color: '#fff', fontSize: 14 },
  btnRow:    { display: 'flex', gap: 8 },
  btn:       { flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
               background: '#fff', color: '#000', fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: '#333', color: '#fff' },
  btnLogout: { padding: '6px 14px', borderRadius: 8, border: 'none',
               background: '#333', color: '#fff', cursor: 'pointer' },
  loggedIn:  { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' },
  userEmail: { color: '#aaa', fontSize: 13, wordBreak: 'break-all' },
  error:     { color: '#f66', fontSize: 13 },
  success:   { color: '#6f6', fontSize: 13 },
}
