import { getCorpsPng, getAccessoirePng, SLOT_TO_DOSSIER } from '../utils/neuriUtils'

/*
  Props :
  - version   : 'enfant' | 'ado' | 'adulte' | 'mature'
  - angle     : 'face' | '3-4'
  - equipes   : { chapeau, haut, lunettes, compagnonObjet }
  - size      : nombre en px (défaut 200)
  - animate   : booléen — légère animation de flottement (défaut true)
  - glowColor : couleur (ex '#8B5CF6') d'un halo lumineux autour de Neuri.
                Sert à conserver la couleur dynamique (violet/bleu/vert)
                qui était portée par l'ancienne mascotte 3D. Défaut : aucun halo.
*/

export default function Neuri2D({
  version = 'adulte',
  angle = 'face',
  equipes = {},
  size = 200,
  animate = true,
  glowColor = null
}) {
  const corpsSrc = getCorpsPng(version, angle)

  // Ordre des calques : corps → haut → chapeau → lunettes → compagnon
  const calques = [
    { slot: 'haut',           zIndex: 2 },
    { slot: 'chapeau',        zIndex: 3 },
    { slot: 'lunettes',       zIndex: 4 },
    { slot: 'compagnonObjet', zIndex: 5 }
  ]

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      animation: animate ? 'neuriFlottement 3s ease-in-out infinite' : 'none',
      filter: glowColor ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 22px ${glowColor})` : 'none'
    }}>

      {/* Corps de Neuri */}
      <img
        src={corpsSrc}
        alt="Neuri"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 1
        }}
        onError={(e) => { e.target.style.opacity = '0' }}
      />

      {/* Calques accessoires */}
      {calques.map(({ slot, zIndex }) => {
        const itemId = equipes[slot]
        const dossier = SLOT_TO_DOSSIER[slot]
        const src = getAccessoirePng(dossier, itemId)
        if (!src) return null

        return (
          <img
            key={slot}
            src={src}
            alt={slot}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex,
              pointerEvents: 'none'
            }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )
      })}

      {/* Animation CSS */}
      <style>{`
        @keyframes neuriFlottement {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}