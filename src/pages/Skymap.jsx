import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CardModal from '../components/CardModal'

const GRID_X = 40
const GRID_Y = 25

// URL publique du skymap complet — le fichier skymap.jpg est à la racine du repo,
// donc accessible depuis /skymap.jpg une fois déployé sur Vercel.
// En local avec Vite, les fichiers dans /public sont aussi servis à la racine.
// → Place skymap.jpg dans le dossier /public de ton projet local.
const SKYMAP_BG = '/skymap.jpg'

export default function Skymap({ user }) {
  const [tiles, setTiles]               = useState(Array(GRID_X * GRID_Y).fill(null))
  const [loading, setLoading]           = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchOwnedCards()
  }, [user])

  async function fetchOwnedCards() {
    setLoading(true)

    const { data: userCards } = await supabase
      .from('user_cards')
      .select('card_id')
      .eq('user_id', user.id)

    const cardIds = (userCards || []).map(uc => uc.card_id)

    if (cardIds.length === 0) { setLoading(false); return }

    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .in('card_id', cardIds)

    const grid = Array(GRID_X * GRID_Y).fill(null)

    for (const card of (cardsData || [])) {
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
      <p style={styles.counter}>
        <span style={styles.countNum}>{owned}</span>
        <span style={styles.countTotal}> / {GRID_X * GRID_Y} cartes découvertes</span>
      </p>

      <div style={styles.scrollWrap}>
        {/*
          Conteneur "position: relative" pour superposer deux couches :
          1. Le skymap complet en arrière-plan (opacité 0.5)
          2. La grille par-dessus
        */}
        <div style={styles.puzzleWrap}>

          {/* ── Couche 1 : image de fond ── */}
          <img
            src={SKYMAP_BG}
            alt="Skymap complète"
            style={styles.bgImage}
          />

          {/* ── Couche 2 : grille par-dessus ── */}
          <div style={styles.grid}>
            {tiles.map((card, index) => {
              if (card) {
                // Tuile possédée : image à pleine opacité, révèle la skymap
                return (
                  <div
                    key={index}
                    style={styles.tileOwned}
                    onClick={() => setSelectedCard(card)}
                    title={card.name}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <img src={card.img_url} alt={card.name} style={styles.tileImg} loading="lazy" />
                  </div>
                )
              } else {
                // Tuile non possédée : masque l'arrière-plan
                // background semi-transparent → laisse légèrement deviner la skymap
                return (
                  <div
                    key={index}
                    style={styles.tileEmpty}
                    title={`#${String(index).padStart(4, '0')} — non découverte`}
                  />
                )
              }
            })}
          </div>

        </div>
      </div>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  )
}

const styles = {
  info: { color: '#888' },
  counter: { marginBottom: 12, fontSize: '0.9rem' },
  countNum: { color: '#fff', fontWeight: 700, fontSize: '1.1rem' },
  countTotal: { color: '#666' },

  scrollWrap: {
    overflowX: 'auto',
    overflowY: 'hidden',
    // Barre de scroll discrète
    scrollbarWidth: 'thin',
    scrollbarColor: '#333 transparent',
  },

  // Conteneur relatif qui accueille le fond ET la grille superposée
  puzzleWrap: {
    position: 'relative',
    minWidth: 600,
    // Le ratio 40:25 = 8:5 est respecté par padding-bottom trick
    // Ainsi la hauteur suit toujours la largeur proportionnellement
    aspectRatio: '40 / 25',
    display: 'block',
  },

  // Image de fond : couvre exactement le puzzleWrap
  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.5,       // ← intensité du fond (0 = invisible, 1 = pleine opacité)
    display: 'block',
  },

  // Grille superposée par-dessus le fond
  grid: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_X}, 1fr)`,
    gap: 0,
  },

  // Tuile possédée : totalement opaque, cache le fond flou
  tileOwned: {
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },

  tileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  // Tuile vide : légèrement transparente pour laisser deviner le fond
  // rgba(0,0,0,0.55) → 55% de noir par-dessus le fond à 50% → effet tamisé
  tileEmpty: {
    background: 'rgba(0, 0, 0, 0.55)',
  },
}
