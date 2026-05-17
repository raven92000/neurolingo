import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLangueActive, getLangueByCode } from '../utils/languages'
import Neuri3D from '../components/Neuri3D'

const TTS_MAP = { en: 'en-US', es: 'es-ES', de: 'de-DE', pt: 'pt-PT' }

// TODO: Remplacer par lecture MP3 Suno + timestamps par lettre quand l'audio
// sera prêt. Pour l'instant, on défile à 1 lettre par seconde via TTS.
const DUREE_PAR_LETTRE_MS = 1000

// Couplets de la chanson alphabet par langue. Ajouter une langue ici pour
// l'activer (et remplir aussi ALPHABET_DATA dans src/data/alphabetData.js
// pour les Ex 1 et 2).
const COUPLETS_PAR_LANGUE = {
  en: [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    ['H', 'I', 'J', 'K'],
    ['L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S'],
    ['T', 'U', 'V'],
    ['W', 'X'],
    ['Y', 'Z'],
  ],
  es: [
    ['A', 'B', 'C', 'D'],
    ['E', 'F', 'G'],
    ['H', 'I', 'J', 'K'],
    ['L', 'M', 'N', 'Ñ'],
    ['O', 'P', 'Q'],
    ['R', 'S', 'T'],
    ['U', 'V', 'W'],
    ['X', 'Y', 'Z'],
  ],
}

function playLetter(letter, lang, voix) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(letter.toLowerCase())
  u.lang = TTS_MAP[lang] || 'en-US'
  if (voix) u.voice = voix
  u.rate = 0.9
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

function getPosition(couplets, lettreIndex) {
  let restant = lettreIndex
  for (let i = 0; i < couplets.length; i++) {
    if (restant < couplets[i].length) {
      return { coupletIndex: i, indexDansCouplet: restant }
    }
    restant -= couplets[i].length
  }
  return {
    coupletIndex: couplets.length - 1,
    indexDansCouplet: couplets[couplets.length - 1].length - 1,
  }
}

function getLettreIndexDebutCouplet(couplets, coupletIndex) {
  let total = 0
  for (let i = 0; i < coupletIndex; i++) total += couplets[i].length
  return total
}

function formatTemps(secondes) {
  const m = Math.floor(secondes / 60).toString().padStart(2, '0')
  const s = (secondes % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function AlphabetChanson() {
  const navigate = useNavigate()

  // Langue figée au mount : changement de langue → sortir/revenir.
  // Fallback sur 'en' si pas de couplets définis pour la langue active.
  const [codeLangue] = useState(() => {
    const demandee = getLangueActive()
    return COUPLETS_PAR_LANGUE[demandee] ? demandee : 'en'
  })
  const langue = getLangueByCode(codeLangue)

  // useMemo pour stabiliser les références entre renders → évite que le
  // useEffect TTS auto se ré-exécute en boucle.
  const couplets = useMemo(() => COUPLETS_PAR_LANGUE[codeLangue], [codeLangue])
  const lettres = useMemo(() => couplets.flat(), [couplets])
  const nbLettres = lettres.length

  const [lettreIndex, setLettreIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voix, setVoix] = useState(null)

  // `termine` est dérivé de lettreIndex pour éviter un setState synchrone
  // dans un useEffect (anti-pattern React Compiler).
  const termine = lettreIndex >= nbLettres

  // Chargement de la voix anglaise (dupliqué depuis AlphabetEcoute.jsx)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    function chargerVoix() {
      const liste = window.speechSynthesis.getVoices()
      const langExact = TTS_MAP[codeLangue] || 'en-US'
      let trouvee = liste.find((v) => v.lang === langExact)
      if (!trouvee) {
        trouvee = liste.find((v) => v.lang.toLowerCase().startsWith(codeLangue))
      }
      if (trouvee) setVoix(trouvee)
    }

    chargerVoix()
    window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
    }
  }, [codeLangue])

  // TODO: Remplacer par lecture MP3 Suno + timestamps par lettre quand
  // l'audio sera prêt. Pour l'instant : useEffect déclaratif qui à chaque
  // changement de lettreIndex lit la lettre puis programme la suivante.
  useEffect(() => {
    if (!isPlaying) return
    if (lettreIndex >= nbLettres) return
    if (voix) playLetter(lettres[lettreIndex], codeLangue, voix)
    const t = setTimeout(() => {
      setLettreIndex((prev) => prev + 1)
    }, DUREE_PAR_LETTRE_MS)
    return () => clearTimeout(t)
  }, [isPlaying, lettreIndex, voix, codeLangue, lettres, nbLettres])

  function togglePlay() {
    if (termine) {
      // Rejouer depuis le début : lettreIndex=0 fait que termine redevient false.
      setLettreIndex(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((prev) => !prev)
  }

  function coupletPrecedent() {
    const { coupletIndex } = getPosition(couplets, lettreIndex)
    if (coupletIndex === 0) return
    setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex - 1))
  }

  function coupletSuivant() {
    const { coupletIndex } = getPosition(couplets, lettreIndex)
    if (coupletIndex >= couplets.length - 1) return
    setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex + 1))
  }

  function repeterCouplet() {
    const { coupletIndex } = getPosition(couplets, lettreIndex)
    setLettreIndex(getLettreIndexDebutCouplet(couplets, coupletIndex))
  }

  function rejouerChanson() {
    // lettreIndex=0 fait que termine (dérivé) redevient false.
    setLettreIndex(0)
    setIsPlaying(true)
  }

  if (termine) {
    return (
      <EcranFin
        onRetour={() => navigate('/learn')}
        onRejouer={rejouerChanson}
      />
    )
  }

  const { coupletIndex, indexDansCouplet } = getPosition(
    couplets,
    Math.min(lettreIndex, nbLettres - 1)
  )
  const coupletCourant = couplets[coupletIndex]

  const totalSec = Math.round((nbLettres * DUREE_PAR_LETTRE_MS) / 1000)
  const ecouleSec = Math.min(
    totalSec,
    Math.round((lettreIndex * DUREE_PAR_LETTRE_MS) / 1000)
  )
  const tempsEcoule = formatTemps(ecouleSec)
  const tempsTotal = formatTemps(totalSec)
  const progression = (lettreIndex / nbLettres) * 100

  const peutReculer = coupletIndex > 0
  const peutAvancer = coupletIndex < couplets.length - 1

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', padding: '20px', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '32px 0 16px' }}>
        <button onClick={() => navigate('/alphabet')} aria-label="Retour" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4 L5 9 L11 14" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '600', color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
            {langue?.drapeau} Fondamentaux
          </p>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
            Chantons l'alphabet
          </h1>
        </div>
      </div>

      {/* Bandeau progression + timer */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>
            Progression
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
            {tempsEcoule} / {tempsTotal}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progression}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', transition: 'width 1s linear' }} />
        </div>
      </div>

      {/* Neuri + bulle */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px' }}>
        <div style={{ width: '90px', height: '90px', flexShrink: 0 }}>
          <Neuri3D color="#8B5CF6" />
        </div>
        <div style={{ flex: 1, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '12px 14px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            Chante avec moi&nbsp;! Appuie sur pause pour répéter. 🎤
          </p>
        </div>
      </div>

      {/* Couplet en gros */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {coupletCourant.map((lettre, i) => (
          <span key={i} style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '36px',
            fontWeight: '900',
            color: i === indexDansCouplet ? '#A78BFA' : 'rgba(255,255,255,0.6)',
            transition: 'color 0.3s ease',
            lineHeight: 1.1,
          }}>
            {lettre}
          </span>
        ))}
      </div>

      {/* Ligne de cadres carrés */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {coupletCourant.map((lettre, i) => {
          const courante = i === indexDansCouplet
          return (
            <div key={i} style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: courante ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: courante ? '2px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '13px',
              fontWeight: '700',
              color: courante ? '#A78BFA' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
            }}>
              {lettre}
            </div>
          )
        })}
      </div>

      {/* Forme d'onde décorative */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '32px', marginBottom: '24px' }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{
            width: '3px',
            background: 'linear-gradient(180deg, #8B5CF6, #A78BFA)',
            borderRadius: '2px',
            animation: `pulseWave 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}/>
        ))}
      </div>

      {/* Boutons player */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
        <button
          onClick={coupletPrecedent}
          disabled={!peutReculer}
          aria-label="Couplet précédent"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: peutReculer ? 'pointer' : 'not-allowed',
            opacity: peutReculer ? 1 : 0.3,
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="2" height="10" fill="#A78BFA" rx="1"/>
            <polygon points="14,3 6,8 14,13" fill="#A78BFA"/>
          </svg>
        </button>

        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(139,92,246,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="5" width="4" height="14" fill="#FFFFFF" rx="1.5"/>
              <rect x="14" y="5" width="4" height="14" fill="#FFFFFF" rx="1.5"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="7,4 7,20 20,12" fill="#FFFFFF"/>
            </svg>
          )}
        </button>

        <button
          onClick={coupletSuivant}
          disabled={!peutAvancer}
          aria-label="Couplet suivant"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: peutAvancer ? 'pointer' : 'not-allowed',
            opacity: peutAvancer ? 1 : 0.3,
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon points="2,3 10,8 2,13" fill="#A78BFA"/>
            <rect x="12" y="3" width="2" height="10" fill="#A78BFA" rx="1"/>
          </svg>
        </button>
      </div>

      {/* Bouton Répéter le couplet */}
      <button
        onClick={repeterCouplet}
        style={{
          alignSelf: 'flex-end',
          background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '20px',
          padding: '8px 14px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          fontWeight: '600',
          color: '#A78BFA',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🔁 Répéter le couplet
      </button>

      <style>{`@keyframes pulseWave { 0%, 100% { height: 30%; } 50% { height: 100%; } }`}</style>
    </div>
  )
}

function EcranFin({ onRetour, onRejouer }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.15) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '80px', height: '80px', background: 'rgba(88,204,2,0.15)', border: '1px solid rgba(88,204,2,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 20 L16 28 L32 12" stroke="#58CC02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px' }}>
        Bravo&nbsp;! 🎉
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 24px' }}>
        Tu connais bien l'alphabet maintenant&nbsp;!
      </p>
      <div style={{
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '32px',
        width: '100%',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', fontWeight: '800', color: '#C4B5FD', margin: 0 }}>
          🌟 Révision de l'alphabet terminée 🌟
        </p>
      </div>
      <button
        onClick={onRetour}
        style={{
          width: '100%',
          height: '54px',
          background: 'linear-gradient(135deg, #58CC02, #3DAD00)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '17px',
          fontWeight: '800',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '12px',
        }}
      >
        Retour à l'apprentissage
      </button>
      <button
        onClick={onRejouer}
        style={{
          width: '100%',
          height: '48px',
          background: 'rgba(139,92,246,0.12)',
          color: '#C4B5FD',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '14px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        Rejouer
      </button>
    </div>
  )
}
