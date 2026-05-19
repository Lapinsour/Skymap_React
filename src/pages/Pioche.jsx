import { useState } from 'react'
import { supabase } from '../lib/supabase'
import CardModal from '../components/CardModal'

export default function Pioche({ user }) {
  // "loading" : vrai pendant qu'on attend la réponse de Supabase
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)   // résultat du pull_card
  const [error, setError]       = useState(null)
  // "selectedCard" : la carte à afficher dans le modal (null = modal fermé)
  const [selectedCard, setSelectedCard] = useState(null)

  async function handlePull() {
    setLoading(true)
    setError(null)
    setResult(null)

    // supabase.rpc() appelle une fonction Postgres — identique au Python
    const { data, error } = await supabase.rpc('pull_card')

    setLoading(false)
    if (error) return setError(error.message)
    if (!data.success) return setError('Limite quotidienne atteinte.')

    // On enrichit l'objet carte avec l'URL publique de l'image
    const card = data.card
    card.img_url = supabase.storage
      .from('Skyline')
      .getPublicUrl(card.image)
      .data.publicUrl
      .replace('/cards', '')

    setResult({ card, already_owned: data.already_owned })
  }

  if (!user) return <p style={styles.info}>Connectez-vous pour piocher.</p>

  return (
    <div>
      <button
        style={{...styles.btn, ...(loading ? styles.btnDisabled : {})}}
        onClick={handlePull}
        disabled={loading}
      >
        {loading ? 'Pioche en cours…' : '🎴 Piocher une carte'}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.resultWrap}>
          {result.already_owned
            ? <p style={styles.warn}>⚠ Doublon</p>
            : <p style={styles.success}>✦ Nouvelle carte !</p>
          }
          {/* La carte tirée s'affiche comme une vignette cliquable */}
          <div
            style={styles.thumb}
            onClick={() => setSelectedCard(result.card)}
          >
            <div style={styles.imgWrap}>
              <img src={result.card.img_url} alt={result.card.name} style={styles.img} />
            </div>
            <p style={styles.name}>{result.card.name}</p>
            <p style={styles.rarity}>{result.card.rarity}</p>
            <p style={styles.hint}>Cliquer pour agrandir</p>
          </div>
        </div>
      )}

      {/* Le modal s'ouvre si selectedCard est non-null.
          onClose remet selectedCard à null → le modal disparaît. */}
      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  )
}

const styles = {
  btn: {
    padding: '12px 28px', borderRadius: 12, border: 'none',
    background: '#fff', color: '#000', fontWeight: 700,
    fontSize: '1rem', cursor: 'pointer', marginBottom: 24,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  info:    { color: '#888' },
  error:   { color: '#f66', marginBottom: 16 },
  warn:    { color: '#fa0', marginBottom: 12, fontWeight: 600 },
  success: { color: '#6f6', marginBottom: 12, fontWeight: 600 },
  resultWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  thumb: {
    width: 220, background: '#111', borderRadius: 14,
    padding: 8, cursor: 'pointer',
  },
  imgWrap: { width: '100%', aspectRatio: '2/3', overflow: 'hidden',
             borderRadius: 10, background: '#222' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  name: { color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginTop: 8 },
  rarity: { color: '#666', fontSize: '0.75rem', marginTop: 2 },
  hint: { color: '#444', fontSize: '0.7rem', marginTop: 6, fontStyle: 'italic' },
}
