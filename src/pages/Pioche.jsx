import { useState } from 'react'
import { supabase } from '../lib/supabase'
import CardModal from '../components/CardModal'

export default function Pioche({ user }) {
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)

  async function handlePull() {
    setLoading(true)
    setError(null)
    setResult(null)

    // Étape 1 : appel de la fonction Supabase
    // Elle retourne maintenant { success, card_id, already_owned, remaining_pulls }
    const { data, error } = await supabase.rpc('pull_card')

    if (error)         { setLoading(false); return setError(error.message) }
    if (!data.success) { setLoading(false); return setError('Limite quotidienne atteinte.') }

    // Étape 2 : on récupère les détails de la carte avec le card_id reçu
    // L'ancienne fonction renvoyait l'objet carte directement,
    // la nouvelle ne renvoie que l'id → on fait une requête séparée.
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('card_id', data.card_id)
      .single()   // .single() retourne un objet au lieu d'un tableau

    if (cardError) { setLoading(false); return setError(cardError.message) }

    // Étape 3 : on construit l'URL publique de l'image
    const card = {
      ...cardData,
      img_url: supabase.storage
        .from('Skyline')
        .getPublicUrl(cardData.image)
        .data.publicUrl
        .replace('/cards', ''),
    }

    setResult({
      card,
      already_owned:   data.already_owned,
      remaining_pulls: data.remaining_pulls,
    })
    setLoading(false)
  }

  if (!user) return <p style={styles.info}>Connectez-vous pour piocher.</p>

  return (
    <div>
      <button
        style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
        onClick={handlePull}
        disabled={loading}
      >
        {loading ? 'Pioche en cours…' : '🎴 Piocher une carte'}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {result && (
        <div style={styles.resultWrap}>
          <div style={styles.statusRow}>
            {result.already_owned
              ? <p style={styles.warn}>⚠ Doublon</p>
              : <p style={styles.success}>✦ Nouvelle carte !</p>
            }
            {/* On affiche les pulls restants grâce au nouveau champ */}
            <p style={styles.remaining}>
              {result.remaining_pulls} pioche{result.remaining_pulls > 1 ? 's' : ''} restante{result.remaining_pulls > 1 ? 's' : ''} aujourd'hui
            </p>
          </div>

          <div style={styles.thumb} onClick={() => setSelectedCard(result.card)}>
            <div style={styles.imgWrap}>
              <img src={result.card.img_url} alt={result.card.name} style={styles.img} />
            </div>
            <p style={styles.name}>{result.card.name}</p>
            <p style={styles.rarity}>{result.card.rarity}</p>
            <p style={styles.hint}>Cliquer pour agrandir</p>
          </div>
        </div>
      )}

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
  warn:    { color: '#fa0', marginBottom: 4, fontWeight: 600 },
  success: { color: '#6f6', marginBottom: 4, fontWeight: 600 },
  remaining: { color: '#555', fontSize: '0.8rem', marginBottom: 16 },
  statusRow: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  resultWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  thumb: {
    width: 220, background: '#111', borderRadius: 14,
    padding: 8, cursor: 'pointer',
  },
  imgWrap: {
    width: '100%', aspectRatio: '2/3', overflow: 'hidden',
    borderRadius: 10, background: '#222',
  },
  img:    { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  name:   { color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginTop: 8 },
  rarity: { color: '#666', fontSize: '0.75rem', marginTop: 2 },
  hint:   { color: '#444', fontSize: '0.7rem', marginTop: 6, fontStyle: 'italic' },
}
