import { useNavigate } from 'react-router-dom'
import { getLangueActive, getLangueByCode } from '../utils/languages'

const ALPHABETS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
  de: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß'.split(''),
}

const TTS_MAP = { en: 'en-US', es: 'es-ES', de: 'de-DE' }

function playLetter(letter, lang) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(letter)
    u.lang = TTS_MAP[lang] || 'en-US'
    u.rate = 0.7
    u.pitch = 1
    window.speechSynthesis.speak(u)
  }
}

export default function Alphabet() {
  const navigate = useNavigate()
  const codeLangue = getLangueActive()
  const langue = getLangueByCode(codeLangue)
  const lettres = ALPHABETS[codeLangue] || ALPHABETS.en

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

      {/* Grille des lettres */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flex: 1 }}>
        {lettres.map((lettre, i) => (
          <button
            key={i}
            onClick={() => playLetter(lettre, codeLangue)}
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
        ))}
      </div>

      {/* Footer info */}
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '16px' }}>
        {lettres.length} lettres · {langue?.nom}
      </p>
    </div>
  )
}