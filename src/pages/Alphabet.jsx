import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLangueActive, getLangueByCode } from '../utils/languages'
import { ALPHABET_DATA, getAlphabetImageUrl } from '../data/alphabetData'
import LeconThumbnail from '../components/LeconThumbnail'

const ALPHABETS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
  de: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'.split(''),
}

const TTS_MAP = { en: 'en-US', es: 'es-ES', de: 'de-DE', pt: 'pt-PT' }

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

function taillePoliceMot(mot) {
  const longueur = mot.length
  if (longueur > 9) return '11px'
  if (longueur > 7) return '12px'
  return '13px'
}

function CarteRiche({ item, codeLangue, voix }) {
  const imageUrl = getAlphabetImageUrl(codeLangue, item.image)

  return (
    <button
      aria-label={item.lettre}
      onClick={() => playLetter(item.lettre, codeLangue, voix)}
      style={{
        position: 'relative',
        aspectRatio: '1',
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(139,92,246,0.25)',
        borderRadius: '18px',
        padding: '12px',
        paddingTop: '32px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 0 16px rgba(139,92,246,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
        e.currentTarget.style.background = 'rgba(139,92,246,0.2)'
        e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.3)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.05)'
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '28px',
          fontWeight: '900',
          color: '#A78BFA',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {item.lettre}
      </span>

      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LeconThumbnail
          imageUrl={imageUrl}
          alt=""
          fill
          objectFit="contain"
          borderRadius={0}
        />
      </div>

      <span
        aria-hidden="true"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: taillePoliceMot(item.mot),
          fontWeight: '600',
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        {item.mot}
      </span>
    </button>
  )
}

function CarteSimple({ lettre, codeLangue, voix }) {
  return (
    <button
      aria-label={lettre}
      onClick={() => playLetter(lettre, codeLangue, voix)}
      style={{
        aspectRatio: '1',
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(139,92,246,0.25)',
        borderRadius: '18px',
        fontSize: '32px',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: '900',
        color: '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 0 16px rgba(139,92,246,0.05)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
        e.currentTarget.style.background = 'rgba(139,92,246,0.2)'
        e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.3)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.05)'
      }}
    >
      {lettre}
    </button>
  )
}

export default function Alphabet() {
  const navigate = useNavigate()
  const codeLangue = getLangueActive()
  const langue = getLangueByCode(codeLangue)

  const donneesRiches = ALPHABET_DATA[codeLangue] || []
  const modeRiche = donneesRiches.length > 0
  const lettresSimples = ALPHABETS[codeLangue] || ALPHABETS.en
  const nombreLettres = modeRiche ? donneesRiches.length : lettresSimples.length

  // Sélectionne une voix TTS qui correspond à la langue active.
  // Sans ça, le navigateur retombe sur la voix système par défaut
  // (souvent française sur un Mac configuré en FR) → prononciation parasite.
  const [voix, setVoix] = useState(null)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    function chargerVoix() {
      const liste = window.speechSynthesis.getVoices()
      // TEMP — logs de debug pour vérifier les voix disponibles
      console.log(
        '🎤 Voix disponibles:',
        liste.map((v) => `${v.name} [${v.lang}]`)
      )

      const langExact = TTS_MAP[codeLangue]
      let trouvee = liste.find((v) => v.lang === langExact)
      if (!trouvee) {
        trouvee = liste.find((v) =>
          v.lang.toLowerCase().startsWith(codeLangue)
        )
      }

      if (trouvee) {
        setVoix(trouvee)
        console.log('✅ Voix sélectionnée:', trouvee.name, trouvee.lang)
      } else {
        console.warn('⚠️ Aucune voix trouvée pour', codeLangue)
      }
    }

    chargerVoix()
    window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
    }
  }, [codeLangue])

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', padding: '20px', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '32px 0 16px' }}>
        <button onClick={() => navigate('/learn')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4 L5 9 L11 14" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '600', color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
            {langue?.drapeau} Fondamentaux
          </p>
          <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
            L'Alphabet
          </h1>
        </div>
      </div>

      {/* Instruction */}
      <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>👆</span>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.4 }}>
          Touche une lettre pour entendre sa prononciation
        </p>
      </div>

      {/* Grille — mode riche (image + mot) ou mode simple (lettres seules) */}
      {modeRiche ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1 }}>
          {donneesRiches.map((item) => (
            <CarteRiche key={item.lettre} item={item} codeLangue={codeLangue} voix={voix} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flex: 1 }}>
          {lettresSimples.map((lettre, i) => (
            <CarteSimple key={i} lettre={lettre} codeLangue={codeLangue} voix={voix} />
          ))}
        </div>
      )}

      {/* Footer info */}
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '16px' }}>
        {nombreLettres} lettres · {langue?.nom}
      </p>
    </div>
  )
}
