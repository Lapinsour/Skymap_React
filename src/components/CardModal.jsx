// Ce composant gère l'overlay plein écran qui s'ouvre quand on clique une carte.
// Il reçoit deux props :
//   - card   : l'objet carte à afficher (ou null si rien n'est sélectionné)
//   - onClose: la fonction à appeler pour fermer le modal
import { useState, useEffect } from 'react'

export default function CardModal({ card, onClose }) {
  // "showDesc" contrôle quelle face est visible : image ou description
  const [showDesc, setShowDesc] = useState(false)

  // useEffect : s'exécute quand "card" change.
  // Quand on ouvre une nouvelle carte, on repart toujours sur la face image.
  // C'est l'équivalent d'un callback déclenché par un changement de variable.
  useEffect(() => {
    setShowDesc(false)
  }, [card])

  // Si card est null, on ne rend rien (le modal est "fermé")
  if (!card) return null

  // Gestion de la touche Échap pour fermer
  // On utilise useEffect pour ajouter/retirer l'écouteur proprement
  // (évite les fuites mémoire si le composant est démonté)

  return (
    // L'overlay couvre toute la fenêtre (position fixed, inset 0)
    // Un clic sur le fond (et pas sur la carte) appelle onClose
    <div style={styles.overlay} onClick={onClose}>

      {/* stopPropagation empêche le clic sur la carte de "traverser"
          jusqu'à l'overlay et de déclencher onClose */}
      <div
        style={styles.modal}
        onClick={e => { e.stopPropagation(); setShowDesc(v => !v) }}
      >
        {/* Bouton fermer — positionné en absolu dans le coin */}
        <button
          style={styles.closeBtn}
          onClick={e => { e.stopPropagation(); onClose() }}
        >✕</button>

        {/* On affiche soit la face image, soit la face description */}
        {!showDesc ? (
          // --- Face image ---
          <div>
            <div style={styles.imgWrap}>
              <img src={card.img_url} alt={card.name} style={styles.img} />
            </div>
            <div style={styles.info}>
              <p style={styles.name}>{card.name}</p>
              <p style={styles.rarity}>Rareté : {card.rarity}</p>
              <p style={styles.hint}>Cliquer pour voir la description →</p>
            </div>
          </div>
        ) : (
          // --- Face description ---
          <div style={styles.descFace}>
            <p style={styles.name}>{card.name}</p>
            <p style={styles.descText}>{card.description}</p>
            <p style={styles.hint}>← Cliquer pour revenir à la carte</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    width: 'min(340px, 90vw)',
    background: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
    animation: 'popIn 0.22s ease',
    userSelect: 'none',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 14,
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)', border: 'none',
    color: '#fff', fontSize: '1rem', cursor: 'pointer',
    zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imgWrap: {
    width: '100%', aspectRatio: '2/3', overflow: 'hidden', background: '#222',
  },
  img: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  info: { padding: '16px 20px 20px' },
  name: { color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 },
  rarity: { color: '#888', fontSize: '0.8rem', marginTop: 4 },
  hint: { color: '#555', fontSize: '0.72rem', marginTop: 10, fontStyle: 'italic' },
  descFace: {
    padding: '40px 28px',
    minHeight: 300,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  descText: { color: '#ccc', fontSize: '0.9rem', lineHeight: 1.65, marginTop: 16 },
}
