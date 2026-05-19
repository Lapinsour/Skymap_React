import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CardGrid from '../components/CardGrid'
import CardModal from '../components/CardModal'

export default function Bibliotheque({ user }) {
  const [cards, setCards]             = useState([])       // toutes les cartes non-common
  const [commonCount, setCommonCount] = useState(0)        // nb de cartes common
  const [loading, setLoading]         = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)   // carte ouverte dans le modal

  // useEffect avec [user] en dépendance :
  // ce bloc s'exécute au montage du composant ET chaque fois que "user" change.
  // C'est l'équivalent d'un "on page load" conditionnel.
  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchCards()
  }, [user])

  async function fetchCards() {
    setLoading(true)

    // 1. Récupérer les IDs des cartes possédées
      
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('card_id, is_shiny')
      .eq('user_id', user.id)
    
    const cardIds = (userCards || []).map(uc => uc.card_id)
    
    // Créer un Map pour accéder rapidement à is_shiny par card_id
    const shinyMap = Object.fromEntries(
      (userCards || []).map(uc => [uc.card_id, uc.is_shiny])
    )
    if (cardIds.length === 0) {
      setCards([])
      setCommonCount(0)
      setLoading(false)
      return
    }

    // 2. Récupérer les détails de ces cartes
    // .in('card_id', cardIds) = WHERE card_id IN (...)
    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .in('card_id', cardIds)

    // 3. Séparer Common / non-Common et enrichir avec l'URL image
    const allCards = cardsData || []

    const common = allCards.filter(c => c.rarity?.toLowerCase() === 'common')
    const nonCommon = allCards
      .filter(c => c.rarity?.toLowerCase() !== 'common')
      .map(c => ({
        ...c,
        is_shiny: shinyMap[c.card_id] ?? false,  // ← injecté ici
        img_url: supabase.storage
          .from('Skyline')
          .getPublicUrl(c.image)
          .data.publicUrl
          .replace('/cards', ''),
      }))

    setCommonCount(common.length)
    setCards(nonCommon)
    setLoading(false)
  }

  if (!user)    return <p style={styles.info}>Connectez-vous pour voir votre bibliothèque.</p>
  if (loading)  return <p style={styles.info}>Chargement…</p>

  return (
    <div>
      {/* Compteur Common */}
      {commonCount > 0 && (
        <div style={styles.commonBadge}>
          <span style={{ fontSize: '1.4rem' }}>🃏</span>
          <div>
            <div style={styles.commonLabel}>Cartes Common</div>
            <div style={styles.commonCount}>{commonCount}</div>
          </div>
        </div>
      )}

      {cards.length === 0
        ? <p style={styles.info}>Aucune carte rare ou supérieure.</p>
        : <>
            {/* CardGrid reçoit la liste des cartes et une fonction onSelect.
                Quand l'utilisateur clique une carte, onSelect est appelé
                avec l'objet carte → on le stocke dans selectedCard
                → le modal s'ouvre. */}
            <CardGrid cards={cards} onSelect={setSelectedCard} />
            <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
          </>
      }
    </div>
  )
}

const styles = {
  info: { color: '#888' },
  commonBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 12, padding: '10px 20px', marginBottom: 24,
  },
  commonLabel: { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  commonCount: { color: '#fff', fontSize: '1.3rem', fontWeight: 700 },
}
