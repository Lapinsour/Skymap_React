import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CardModal from '../components/CardModal'

// ─────────────────────────────────────────
// WEB AUDIO HELPERS
// Tous les sons sont synthétisés en JS pur —
// pas besoin de fichiers audio externes.
// ─────────────────────────────────────────

function getAudioContext() {
  // On réutilise le même contexte audio pour toute la session
  if (!window._skyAudioCtx) {
    window._skyAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return window._skyAudioCtx
}

// Son de suspense : bourdonnement grave qui monte légèrement
function playSuspense() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(60, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 1.2)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3)
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 1.2)
}

// Son de flip : swoosh rapide
function playFlip() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25)
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}

// Son de nouvelle carte : accord brillant ascendant
function playNewCard() {
  const ctx = getAudioContext()
  // On joue trois notes en arpège
  ;[0, 100, 200].forEach((delay, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    const freqs = [523, 659, 784]  // Do, Mi, Sol
    osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + delay / 1000)
    gain.gain.setValueAtTime(0, ctx.currentTime + delay / 1000)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay / 1000 + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.6)
    osc.start(ctx.currentTime + delay / 1000)
    osc.stop(ctx.currentTime + delay / 1000 + 0.6)
  })
}

// Son de doublon : son sourd descendant
function playDuplicate() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(220, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.4)
}

// ─────────────────────────────────────────
// COMPOSANT PARTICULES
// Éclat de points dorés qui s'envolent depuis le centre
// ─────────────────────────────────────────

function Particles({ active }) {
  // On génère 24 particules avec des angles et vitesses aléatoires
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360 + Math.random() * 15,
    distance: 80 + Math.random() * 80,
    size: 4 + Math.random() * 5,
    duration: 0.6 + Math.random() * 0.4,
    delay: Math.random() * 0.15,
  }))

  if (!active) return null

  return (
    <div style={particleStyles.container}>
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.distance
        const ty = Math.sin(rad) * p.distance
        return (
          <div
            key={p.id}
            style={{
              ...particleStyles.particle,
              width: p.size,
              height: p.size,
              // On utilise une CSS custom property pour l'animation
              // Les keyframes sont définies dans index.css
              animation: `particleFly ${p.duration}s ${p.delay}s ease-out forwards`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            }}
          />
        )
      })}
    </div>
  )
}

const particleStyles = {
  container: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',  // les particules ne bloquent pas les clics
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #ffe066, #ffaa00)',
    boxShadow: '0 0 6px #ffaa00',
  },
}

// ─────────────────────────────────────────
// COMPOSANT CARTE RETOURNABLE
// Gère le flip 3D dos → face
// ─────────────────────────────────────────

function FlipCard({ card, flipped, onClick }) {
  return (
    // "perspective" sur le parent donne la profondeur 3D
    <div style={flipStyles.scene}>
      <div style={{
        ...flipStyles.card,
        // On applique la rotation selon l'état "flipped"
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* ── Face dos ── */}
        <div style={flipStyles.face}>
          <div style={flipStyles.cardBack}>
            {/* Motif étoilé minimaliste sur le dos */}
            <div style={flipStyles.backPattern}>✦</div>
            <p style={flipStyles.backLabel}>Skymap</p>
          </div>
        </div>

        {/* ── Face avant (image de la carte) ── */}
        {/* "rotateY(180deg)" sur la face avant la place derrière au départ */}
        <div style={{ ...flipStyles.face, ...flipStyles.faceFront }}>
          {card && (
            <div style={flipStyles.frontContent} onClick={onClick}>
              <div style={flipStyles.imgWrap}>
                <img src={card.img_url} alt={card.name} style={flipStyles.img} />
              </div>
              <div style={flipStyles.info}>
                <p style={flipStyles.name}>{card.name}</p>
                <p style={flipStyles.rarity}>{card.rarity}</p>
                <p style={flipStyles.hint}>Cliquer pour agrandir</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const flipStyles = {
  // "perspective" crée l'espace 3D — plus la valeur est petite, plus l'effet est fort
  scene: {
    width: 220,
    perspective: '800px',
    position: 'relative',
  },
  card: {
    width: '100%',
    position: 'relative',
    // "transform-style: preserve-3d" dit au navigateur que les enfants
    // sont dans le même espace 3D que le parent
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  face: {
    // "backface-visibility: hidden" cache la face quand elle est dos au spectateur
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 14,
    overflow: 'hidden',
  },
  faceFront: {
    position: 'absolute',
    inset: 0,
    // La face avant est retournée de 180° — elle est donc invisible au départ
    transform: 'rotateY(180deg)',
  },
  cardBack: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #1a1a2e 50%, #0d1b2a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '2/3',
    border: '2px solid #2a2a4a',
  },
  backPattern: {
    fontSize: '4rem',
    color: '#3a3a6a',
    marginBottom: 12,
    textShadow: '0 0 20px #6060ff44',
  },
  backLabel: {
    color: '#3a3a6a',
    fontSize: '0.8rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  frontContent: {
    background: '#111',
    borderRadius: 14,
    padding: 8,
    cursor: 'pointer',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: '2/3',
    overflow: 'hidden',
    borderRadius: 10,
    background: '#222',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  info: { padding: '8px 4px 4px' },
  name: { color: '#fff', fontSize: '0.9rem', fontWeight: 600 },
  rarity: { color: '#666', fontSize: '0.75rem', marginTop: 2 },
  hint: { color: '#444', fontSize: '0.7rem', marginTop: 6, fontStyle: 'italic' },
}

// ─────────────────────────────────────────
// PAGE PIOCHE
// ─────────────────────────────────────────

// Les états possibles de l'animation :
// idle → waiting (carte dos visible) → flipping → revealed
const STATE = { IDLE: 'idle', WAITING: 'waiting', FLIPPING: 'flipping', REVEALED: 'revealed' }

export default function Pioche({ user }) {
  const [animState, setAnimState]       = useState(STATE.IDLE)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState(null)
  const [particles, setParticles]       = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  // useRef permet de stocker une valeur sans déclencher de re-rendu
  // On l'utilise pour le timer de tremblement
  const shakeTimer = useRef(null)

  async function handlePull() {
    if (animState !== STATE.IDLE) return

    setError(null)
    setResult(null)
    setParticles(false)

    // 1. Afficher le dos de la carte + son de suspense
    setAnimState(STATE.WAITING)
    playSuspense()

    // 2. Requête Supabase (en parallèle de l'animation de suspense)
    const { data, error: rpcError } = await supabase.rpc('pull_card')

    if (rpcError || !data?.success) {
      setAnimState(STATE.IDLE)
      return setError(rpcError?.message || 'Limite quotidienne atteinte.')
    }

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('card_id', data.card_id)
      .single()

    if (!cardData) {
      setAnimState(STATE.IDLE)
      return setError('Carte introuvable.')
    }

    const card = {
      ...cardData,
      already_owned: data.already_owned,
      remaining_pulls: data.remaining_pulls,
      img_url: supabase.storage
        .from('Skyline')
        .getPublicUrl(cardData.image)
        .data.publicUrl
        .replace('/cards', ''),
    }

    // 3. Délai minimum de suspense (au moins 1.2s pour que le son joue)
    await new Promise(r => setTimeout(r, 1200))

    // 4. Flip !
    playFlip()
    setResult(card)
    setAnimState(STATE.FLIPPING)

    // 5. Après le flip (600ms = durée de la transition CSS), on "révèle"
    await new Promise(r => setTimeout(r, 650))
    setAnimState(STATE.REVEALED)

    // 6. Son et particules selon le résultat
    if (card.already_owned) {
      playDuplicate()
    } else {
      playNewCard()
      setParticles(true)
      // Les particules disparaissent après 1s
      setTimeout(() => setParticles(false), 1000)
    }
  }

  function reset() {
    setAnimState(STATE.IDLE)
    setResult(null)
    setParticles(false)
  }

  if (!user) return <p style={styles.info}>Connectez-vous pour piocher.</p>

  const isFlipped = animState === STATE.FLIPPING || animState === STATE.REVEALED
  const showCard  = animState !== STATE.IDLE

  return (
    <div style={styles.page}>

      {/* Bouton principal */}
      {animState === STATE.IDLE && (
        <button style={styles.btn} onClick={handlePull}>
          🎴 Piocher une carte
        </button>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* Zone de la carte */}
      {showCard && (
        <div style={styles.cardZone}>

          {/* Statut (doublon / nouvelle carte) — apparaît après le flip */}
          {animState === STATE.REVEALED && (
            <div style={styles.statusRow}>
              {result.already_owned
                ? <p style={styles.warn}>⚠ Doublon</p>
                : <p style={styles.success}>✦ Nouvelle carte !</p>
              }
              <p style={styles.remaining}>
                {result.remaining_pulls} pioche{result.remaining_pulls !== 1 ? 's' : ''} restante{result.remaining_pulls !== 1 ? 's' : ''} aujourd'hui
              </p>
            </div>
          )}

          {/* Carte retournable + particules */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Particles active={particles} />
            <FlipCard
              card={result}
              flipped={isFlipped}
              onClick={() => result && setSelectedCard(result)}
            />
          </div>

          {/* Bouton rejouer — apparaît après la révélation */}
          {animState === STATE.REVEALED && (
            <button style={styles.btnSecondary} onClick={reset}>
              Piocher à nouveau
            </button>
          )}

        </div>
      )}

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20 },
  btn: {
    padding: '12px 28px', borderRadius: 12, border: 'none',
    background: '#fff', color: '#000', fontWeight: 700,
    fontSize: '1rem', cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 22px', borderRadius: 10, border: '1px solid #333',
    background: 'transparent', color: '#aaa',
    fontSize: '0.9rem', cursor: 'pointer', marginTop: 8,
  },
  info:      { color: '#888' },
  error:     { color: '#f66' },
  warn:      { color: '#fa0', fontWeight: 600, margin: 0 },
  success:   { color: '#6f6', fontWeight: 600, margin: 0 },
  remaining: { color: '#555', fontSize: '0.8rem', margin: 0 },
  statusRow: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  cardZone:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
}
