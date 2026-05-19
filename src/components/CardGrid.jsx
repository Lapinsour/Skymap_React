export default function CardGrid({ cards, onSelect }) {
  return (
    <div style={styles.grid}>
      {cards.map(card => (
        <div
          key={card.card_id}
          style={{
            ...styles.thumb,
            // Bordure dorée persistante sur les cartes shiny
            border: card.is_shiny
              ? '1px solid rgba(255, 200, 60, 0.5)'
              : '1px solid transparent',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={() => onSelect(card)}
          onMouseEnter={e => {
            e.currentTarget.style.transform = card.is_shiny
              ? 'translateY(-4px) perspective(600px) rotateY(5deg) rotateX(-2deg) scale(1.04)'
              : 'translateY(-4px)'
            e.currentTarget.style.boxShadow = card.is_shiny
              ? '0 8px 28px rgba(255, 200, 60, 0.35), 0 0 12px rgba(255, 180, 255, 0.2)'
              : '0 8px 24px rgba(255,255,255,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Reflet arc-en-ciel animé (uniquement si shiny) */}
          {card.is_shiny && <ShinyOverlay />}

          <div style={styles.imgWrap}>
            <img src={card.img_url} alt={card.name} style={styles.img} loading="lazy" />
          </div>
          <p style={styles.name}>{card.name}</p>
          <p style={{
            ...styles.rarity,
            // Rarity en doré pour les cartes shiny
            color: card.is_shiny ? '#c8960c' : '#666',
            fontWeight: card.is_shiny ? 600 : 400,
          }}>
            {card.is_shiny ? '✦ ' : ''}{card.rarity}
          </p>
        </div>
      ))}
    </div>
  )
}

// Composant séparé pour l'overlay shiny
// (évite de répéter le style inline dans chaque carte)
function ShinyOverlay() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(
        115deg,
        transparent 20%,
        rgba(255,255,255,0.12) 30%,
        rgba(255,100,200,0.18) 40%,
        rgba(100,200,255,0.18) 50%,
        rgba(200,255,100,0.18) 60%,
        rgba(255,255,255,0.12) 70%,
        transparent 80%
      )`,
      backgroundSize: '200% 200%',
      animation: 'shiny-sweep 3s linear infinite',
      pointerEvents: 'none',
      borderRadius: 'inherit',
      zIndex: 1,
    }} />
  )
}
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 14,
  },
  thumb: {
    background: '#111',
    borderRadius: 14,
    padding: 8,
    cursor: 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: '2/3',
    overflow: 'hidden',
    borderRadius: 10,
    background: '#222',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  name: {
    color: '#fff', fontSize: '0.78rem', fontWeight: 600,
    marginTop: 6, marginBottom: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  rarity: { color: '#666', fontSize: '0.68rem', marginTop: 2 },
}
