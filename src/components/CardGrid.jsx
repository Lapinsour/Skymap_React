// CardGrid reçoit :
//   - cards    : tableau d'objets carte à afficher
//   - onSelect : fonction appelée quand l'utilisateur clique une carte
//                (le parent s'occupe d'ouvrir le modal)
export default function CardGrid({ cards, onSelect }) {
  return (
    // CSS Grid : 4 colonnes sur desktop, 2 sur mobile (via minmax)
    <div style={styles.grid}>
      {/* .map() en JS = boucle for sur une liste.
          On transforme chaque objet "card" en JSX.
          La prop "key" est obligatoire dans les listes React :
          elle aide React à identifier quels éléments ont changé. */}
      {cards.map(card => (
        <div
          key={card.card_id}
          style={styles.thumb}
          onClick={() => onSelect(card)}
          // onMouseEnter/Leave pour l'effet hover (React gère ça en JS
          // car les pseudo-classes CSS :hover ne marchent pas en style inline)
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={styles.imgWrap}>
            <img src={card.img_url} alt={card.name} style={styles.img} loading="lazy" />
          </div>
          <p style={styles.name}>{card.name}</p>
          <p style={styles.rarity}>{card.rarity}</p>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    // repeat(auto-fill, minmax(160px, 1fr)) :
    // crée autant de colonnes que possible d'au moins 160px de large.
    // Sur grand écran → 4-5 colonnes ; sur mobile → 2 colonnes.
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
