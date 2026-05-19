import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CardModal from '../components/CardModal'

// La grille originale : 40 tuiles en largeur, 25 en hauteur = 1000 cartes
const GRID_X = 40
const GRID_Y = 25

export default function Skymap({ user }) {
  // On stocke un tableau de 1000 éléments.
  // Chaque élément est soit null (carte non possédée) soit l'objet carte.
  const [tiles, setTiles]           = useState(Array(GRID_X * GRID_Y).fill(null))
  const [loading, setLoading]       = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchOwnedCards()
  }, [user])

  async function fetchOwnedCards() {
    setLoading(true)

    // 1. Récupérer les card_id possédés par l'utilisateur
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('card_id')
      .eq('user_id', user.id)

    const cardIds = (userCards || []).map(uc => uc.card_id)

    if (cardIds.length === 0) {
      setLoading(false)
      return
    }

    // 2. Récupérer les détails de ces cartes
    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .in('card_id', cardIds)

    // 3. Construire le tableau de 1000 cases
    // On repart d'un tableau vide de 1000 nulls
    const grid = Array(GRID_X * GRID_Y).fill(null)

    for (const card of (cardsData || [])) {
      // Le nom du fichier est "cards/0042.webp" → on extrait l'index numérique
      // "cards/0042.webp".replace("cards/","") → "0042.webp"
      // parseInt("0042.webp") → 42  (parseInt s'arrête au premier caractère non-numérique)
      const filename = card.image.replace('cards/', '')
      const index = parseInt(filename, 10)

      if (index >= 0 && index < GRID_X * GRID_Y) {
        grid[index] = {
          ...card,
          img_url: supabase.storage
            .from('Skyline')
            .getPublicUrl(card.image)
            .data.publicUrl
            .replace('/cards', ''),
        }
      }
    }

    setTiles(grid)
    setLoading(false)
  }

  if (!user)   return <p style={styles.info}>Connectez-vous pour voir votre Skymap.</p>
  if (loading) return <p style={styles.info}>Chargement de la Skymap…</p>

  const owned = tiles.filter(Boolean).length

  return (
    <div>
      {/* Compteur de progression */}
      <p style={styles.counter}>
        <span style={styles.countNum}>{owned}</span>
        <span style={styles.countTotal}> / {GRID_X * GRID_Y} cartes découvertes</span>
      </p>

      {/* Conteneur scrollable horizontalement sur mobile */}
      <div style={styles.scrollWrap}>
        {/*
          La grille CSS : on définit exactement 40 colonnes de largeur égale.
          "repeat(40, 1fr)" = 40 colonnes qui se partagent l'espace disponible.
          Sur desktop la skymap prend toute la largeur.
          Sur mobile elle scrolle horizontalement.
        */}
        <div style={styles.grid}>
          {tiles.map((card, index) => {
            // Chaque tuile est soit une image (carte possédée) soit un carré sombre
            const col = index % GRID_X       // position x dans la grille
            const row = Math.floor(index / GRID_X)  // position y

            if (card) {
              // Carte possédée : image cliquable
              return (
                <div
                  key={index}
                  style={styles.tileOwned}
                  onClick={() => setSelectedCard(card)}
                  title={card.name}
                >
                  <img
                    src={card.img_url}
                    alt={card.name}
                    style={styles.tileImg}
                    loading="lazy"
                  />
                </div>
              )
            } else {
              // Carte non possédée : case noire avec légère grille visible
              return (
                <div
                  key={index}
                  style={styles.tileEmpty}
                  title={`Carte #${String(index).padStart(4, '0')} — non découverte`}
                />
              )
            }
          })}
        </div>
      </div>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  )
}

const TILE_SIZE = '2.5vw'  // chaque tuile fait 1/40e de la largeur viewport

const styles = {
  info: { color: '#888' },

  counter: { marginBottom: 16, fontSize: '0.9rem' },
  countNum: { color: '#fff', fontWeight: 700, fontSize: '1.2rem' },
  countTotal: { color: '#666' },

  // Permet le scroll horizontal sur petits écrans
  scrollWrap: {
    overflowX: 'auto',
    overflowY: 'hidden',
  },

  // Grille CSS exactement 40 colonnes
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_X}, 1fr)`,
    gap: 1,                    // 1px entre les tuiles pour voir les jointures
    minWidth: 600,             // largeur minimale avant scroll horizontal
    background: '#222',        // la couleur du gap entre tuiles
    border: '1px solid #222',
  },

  // Tuile possédée
  tileOwned: {
    aspectRatio: '1',          // les tuiles sont carrées dans la grille
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'filter 0.15s, transform 0.15s',
    // Le hover est géré en CSS via une classe — mais comme on est en style inline,
    // on utilise onMouseEnter/Leave dans le JSX (voir ci-dessus)
  },

  tileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  // Tuile non possédée : carré sombre avec légère transparence
  tileEmpty: {
    aspectRatio: '1',
    background: '#0a0a0a',
    transition: 'background 0.15s',
  },
}
