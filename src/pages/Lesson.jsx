import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'

// ─── ILLUSTRATIONS SVG PAR MOT ───────────────────────────────
const SVG_MAP = {
  'Hello': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="36" r="22" fill="#7C3AED" opacity="0.15"/>
      <circle cx="40" cy="36" r="16" fill="#8B5CF6" opacity="0.25"/>
      <path d="M28 36 L34 30 L34 42 M34 36 L40 36 M40 30 L40 42 M46 30 L46 42 M46 30 C50 30 52 33 52 36 C52 39 50 42 46 42" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  'Goodbye': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="36" r="22" fill="#2563EB" opacity="0.15"/>
      <circle cx="40" cy="36" r="16" fill="#3B82F6" opacity="0.2"/>
      <path d="M28 36 C28 29 34 24 40 24 C46 24 52 29 52 36 C52 43 46 48 40 48 C34 48 28 43 28 36Z" stroke="#60A5FA" strokeWidth="2" fill="none"/>
      <path d="M34 36 L40 42 L52 28" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Thank you': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="36" r="22" fill="#059669" opacity="0.12"/>
      <circle cx="40" cy="36" r="16" fill="#10B981" opacity="0.18"/>
      <path d="M40 24 C40 24 32 28 32 36 C32 40 35 43 40 48 C45 43 48 40 48 36 C48 28 40 24 40 24Z" stroke="#34D399" strokeWidth="2" fill="none"/>
      <path d="M36 36 L39 39 L44 33" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Please': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="36" r="22" fill="#D97706" opacity="0.12"/>
      <circle cx="40" cy="36" r="16" fill="#F59E0B" opacity="0.18"/>
      <path d="M32 32 L40 24 L48 32 L48 44 C48 46 46 48 44 48 L36 48 C34 48 32 46 32 44 Z" stroke="#FCD34D" strokeWidth="2" fill="none"/>
      <path d="M36 40 L40 44 L44 36" stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Yes / No': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="36" r="22" fill="#7C3AED" opacity="0.1"/>
      <circle cx="29" cy="36" r="10" fill="#58CC02" opacity="0.2" stroke="#58CC02" strokeWidth="1.5"/>
      <circle cx="51" cy="36" r="10" fill="#EF4444" opacity="0.2" stroke="#EF4444" strokeWidth="1.5"/>
      <path d="M25 36 L28 39 L33 33" stroke="#58CC02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M47 33 L55 39 M55 33 L47 39" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'default': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="24" fill="#8B5CF6" opacity="0.15"/>
      <circle cx="40" cy="40" r="16" fill="#8B5CF6" opacity="0.2"/>
    </svg>
  ),
}

function playWord(word) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.85
    u.pitch = 1
    window.speechSynthesis.speak(u)
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── ÉCRAN CHARGEMENT ─────────────────────────────────────────
function EcranChargement() {
  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        Chargement de la leçon...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── ÉCRAN INTRO ─────────────────────────────────────────────
function EcranIntro({ mots, onStart }) {
  const [index, setIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [audioDebloque, setAudioDebloque] = useState(false)

  const motActuel = mots[index]
  const estDernier = index === mots.length - 1

  // Audio auto au changement de mot (sauf au tout premier affichage)
  useEffect(() => {
    if (audioDebloque && motActuel) {
      setTimeout(() => playWord(motActuel.en), 200)
    }
  }, [index, audioDebloque, motActuel])

  const debloquerAudioEtJouer = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0.01
      window.speechSynthesis.speak(u)
    }
    setAudioDebloque(true)
    setTimeout(() => playWord(motActuel.en), 100)
  }

  const swipeSuivant = () => {
    if (index < mots.length - 1) setIndex(index + 1)
  }
  const swipePrecedent = () => {
    if (index > 0) setIndex(index - 1)
  }

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > 50) swipeSuivant()
    if (distance < -50) swipePrecedent()
  }

  if (!motActuel) return null

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>

      {/* Header progression chapitre */}
      <div style={{ padding: '52px 0 16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1,2,3,4,5,6,7].map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i === 0 ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>
          ))}
        </div>
      </div>

      {/* Titre chapitre */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Chapitre 1 · Unité 1</p>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: 0, lineHeight: 1.1 }}>Les Salutations</h1>
      </div>

      {/* Dots carrousel */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
        {mots.map((_, i) => (
          <div key={i} style={{
            width: i === index ? '24px' : '8px',
            height: '8px',
            borderRadius: '99px',
            background: i === index ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }}/>
        ))}
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '0 0 24px', letterSpacing: '0.08em' }}>
        Mot {index + 1} sur {mots.length}
      </p>

      {/* Carte du mot — zone swipeable */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '20px 0',
          minHeight: '380px',
        }}
      >
        {/* Illustration */}
        <div
          onClick={debloquerAudioEtJouer}
          style={{
            width: '180px',
            height: '180px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(139,92,246,0.18)',
            transition: 'all 0.4s ease',
            transform: 'scale(1.1)',
          }}
        >
          {motActuel.svg}
        </div>

        {/* Mot anglais + bouton audio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '44px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '0.01em' }}>
            {motActuel.en}
          </h2>
          <button
            onClick={debloquerAudioEtJouer}
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
              <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Traduction française */}
        <div style={{
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '20px',
          padding: '10px 22px',
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', color: '#C4B5FD', margin: 0, fontWeight: '500' }}>
            {motActuel.fr}
          </p>
        </div>
      </div>

      {/* Hint swipe (seulement sur le 1er mot) */}
      {index === 0 && (
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '0 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          ← Glisse pour découvrir le mot suivant →
        </p>
      )}

      {/* Boutons navigation */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={swipePrecedent}
          disabled={index === 0}
          style={{
            width: '54px',
            height: '54px',
            background: index === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.12)',
            border: index === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(139,92,246,0.25)',
            borderRadius: '16px',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: index === 0 ? 0.4 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4 L5 9 L11 14" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {estDernier ? (
          <button
            onClick={onStart}
            style={{
              flex: 1,
              height: '54px',
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 0 28px rgba(124,58,237,0.35)',
            }}
          >
            Commencer la leçon
          </button>
        ) : (
          <button
            onClick={swipeSuivant}
            style={{
              flex: 1,
              height: '54px',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#C4B5FD',
              borderRadius: '16px',
              fontSize: '15px',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Mot suivant →
          </button>
        )}
      </div>

    </div>
  )
}

// ─── ÉCRAN EXPOSITION ─────────────────────────────────────────
function EcranExposition({ mot, etape, total, onNext }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const DUREE = 3500

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => playWord(mot.en), 500)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + (100 / (DUREE / 50))
      })
    }, 50)
    const timer = setTimeout(() => onNext(), DUREE)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [mot, onNext])

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>
          ))}
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 48px' }}>
        Nouveau mot
      </p>

      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'all 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', width: '100%' }}>
        <div onClick={() => playWord(mot.en)} style={{ width: '160px', height: '160px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>
          {mot.svg}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '44px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{mot.en}</h2>
            <button onClick={() => playWord(mot.en)} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
                <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '8px 18px' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', color: '#C4B5FD', margin: 0, fontWeight: '500' }}>{mot.fr}</p>
          </div>
        </div>

        <div style={{ width: '120px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.05s linear' }}/>
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Mémorise ce mot...</p>
      </div>
    </div>
  )
}

// ─── ÉCRAN EXERCICE ───────────────────────────────────────────
function EcranExercice({ mot, etape, total, onNext, onErreur }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showNeuri, setShowNeuri] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)

  const choix = useMemo(() => shuffle([mot.en, ...mot.distracteurs]).slice(0, 3), [mot])

  useEffect(() => {
    setTimeout(() => playWord(mot.en), 400)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [mot])

  const startCountdown = (seconds) => {
    setCountdown(seconds)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); setShowContinue(true); return null }
        return prev - 1
      })
    }, 1000)
  }

  const handleSelect = useCallback((c) => {
    if (selected) return
    setSelected(c)
    const correct = c === mot.en
    setFeedback(correct ? 'correct' : 'wrong')
    if (!correct) onErreur()
    setTimeout(() => setShowNeuri(true), 400)
    startCountdown(correct ? 1 : 3)
  }, [selected, mot, onErreur])

  const neurColor = feedback === 'correct' ? '#58CC02' : '#8B5CF6'
  const neuriMessage = feedback === 'correct' ? "Bien joué, tu l'as reconnu !" : `Presque ! Le bon mot était ${mot.en}. On le reverra plus tard.`

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>
          ))}
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 24px' }}>
        Quel mot entends-tu ?
      </p>

      <div onClick={() => playWord(mot.en)} style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.04)', border: feedback === 'correct' ? '1.5px solid rgba(88,204,2,0.4)' : feedback === 'wrong' ? '1.5px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '10px', boxShadow: feedback === 'correct' ? '0 0 28px rgba(88,204,2,0.18)' : feedback === 'wrong' ? '0 0 28px rgba(245,158,11,0.12)' : '0 0 20px rgba(139,92,246,0.1)', transition: 'all 0.3s ease' }}>
        {mot.svg}
      </div>

      <button onClick={() => playWord(mot.en)} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#A78BFA', marginBottom: '24px' }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
          <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
          <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Réécouter
      </button>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {choix.map((c) => {
          const isSelected = selected === c
          const isCorrect = feedback && c === mot.en
          const isWrong = feedback === 'wrong' && isSelected && c !== mot.en
          return (
            <div key={c} onClick={() => handleSelect(c)} style={{ background: isCorrect ? 'rgba(88,204,2,0.1)' : isWrong ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '17px 20px', cursor: feedback ? 'default' : 'pointer', transition: 'all 0.25s ease', transform: isSelected && !feedback ? 'scale(1.02)' : 'scale(1)' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '700', color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF', margin: 0, textAlign: 'center' }}>{c}</p>
            </div>
          )
        })}
      </div>

      {feedback === 'wrong' && (
        <div style={{ width: '100%', background: 'rgba(88,204,2,0.06)', border: '1px solid rgba(88,204,2,0.25)', borderRadius: '14px', padding: '14px 18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="rgba(88,204,2,0.6)" strokeWidth="1.5"/>
              <path d="M5 8 L7 10 L11 6" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: '600', color: 'rgba(134,239,172,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Correction</p>
          </div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Tu as entendu : <span style={{ color: '#86EFAC', fontWeight: '700' }}>{mot.en}</span>
          </p>
        </div>
      )}

      {showNeuri && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
            <Neuri3D color={neurColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 14px', marginBottom: feedback === 'wrong' ? '10px' : '0' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>{neuriMessage}</p>
            </div>
            {feedback === 'wrong' && (
              <button onClick={() => playWord(mot.en)} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#A78BFA' }}>
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                  <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
                  <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Réécouter {mot.en}
              </button>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div style={{ width: '100%' }}>
          {countdown !== null && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: '0 0 6px', textAlign: 'center' }}>Continuer dans {countdown}...</p>
              <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: feedback === 'correct' ? '#58CC02' : '#8B5CF6', borderRadius: '99px', animation: `shrink ${feedback === 'correct' ? 1 : 3}s linear forwards` }}/>
              </div>
            </div>
          )}
          <button onClick={() => showContinue && onNext(feedback === 'correct')} disabled={!showContinue} style={{ width: '100%', height: '54px', background: !showContinue ? 'rgba(255,255,255,0.06)' : feedback === 'correct' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: !showContinue ? 'rgba(255,255,255,0.25)' : '#FFFFFF', border: !showContinue ? '1px solid rgba(255,255,255,0.08)' : 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: showContinue ? 'pointer' : 'not-allowed', transition: 'all 0.4s ease' }}>
            Continuer
          </button>
          {feedback === 'wrong' && (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '12px 0 0' }}>Chaque erreur te fait progresser.</p>
          )}
        </div>
      )}
      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  )
}

// ─── ÉCRAN RÉPÉTITION ORALE ───────────────────────────────────
function EcranRepetition({ mot, etape, total, onNext }) {
  const [repetitions, setRepetitions] = useState(0)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => { setTimeout(() => playWord(mot.en), 400) }, [mot])

  const handleRepete = () => {
    playWord(mot.en)
    const next = repetitions + 1
    setRepetitions(next)
    if (next >= 2) setTimeout(() => setShowContinue(true), 800)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>
          ))}
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>

      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 32px' }}>Répète à voix haute</p>
      <div style={{ marginBottom: '20px' }}>{mot.svg}</div>
      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '42px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center' }}>{mot.en}</h2>
      <button onClick={() => playWord(mot.en)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#A78BFA' }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
          <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
          <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Réécouter
      </button>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ width: '40px', height: '6px', borderRadius: '99px', background: i < repetitions ? '#8B5CF6' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }}/>
        ))}
      </div>

      {!showContinue && (
        <button onClick={handleRepete} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}>
          {repetitions === 0 ? "J'ai répété" : 'Encore une fois'}
        </button>
      )}
      <div style={{ width: '100%', opacity: showContinue ? 1 : 0, transform: showContinue ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease', pointerEvents: showContinue ? 'auto' : 'none' }}>
        <button onClick={() => onNext(true)} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer' }}>
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── ÉCRAN FIN ────────────────────────────────────────────────
function EcranFin({ xp, total, navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.15) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '80px', height: '80px', background: 'rgba(88,204,2,0.15)', border: '1px solid rgba(88,204,2,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 20 L16 28 L32 12" stroke="#58CC02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px' }}>Leçon terminée</h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 40px' }}>Tu as appris {total} mots aujourd'hui</p>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '48px', width: '100%' }}>
        {[
          { label: 'Mots appris', value: `${total}/${total}`, color: '#58CC02' },
          { label: 'XP gagnés', value: `+${xp}`, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '900', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/dashboard')} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer' }}>
        Continuer
      </button>
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────
export default function Lesson() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('intro')
  const [xp, setXp] = useState(0)
  const [mots, setMots] = useState([])
  const [chargement, setChargement] = useState(true)
  const erreursRef = useRef([])

  useEffect(() => {
  async function chargerMots() {
    // 1. Récupérer la leçon "Les Salutations"
    const { data: lecon } = await supabase
      .from('lecons')
      .select('id')
      .eq('titre', 'Les Salutations')
      .single()

    if (!lecon) { setChargement(false); return }

    // 2. Récupérer les mots de cette leçon uniquement
    const { data, error } = await supabase
      .from('mots')
      .select('*')
      .eq('lecon_id', lecon.id)
      .order('ordre')

    if (!error && data) {
      setMots(data.map(m => ({
        id: m.id,
        en: m.mot_en,
        fr: m.mot_fr,
        distracteurs: [m.distracteur_1, m.distracteur_2, m.distracteur_3].filter(Boolean),
        svg: SVG_MAP[m.mot_en] || SVG_MAP['default'],
      })))
    }
    setChargement(false)
  }
  chargerMots()
}, [])
  const sequence = useMemo(() => [
    ...mots.map((_, i) => ({ type: 'exposition', index: i })),
    ...mots.map((_, i) => ({ type: 'exercice', index: i })),
    ...mots.map((_, i) => ({ type: 'repetition', index: i })),
  ], [mots])

  const [etape, setEtape] = useState(0)
  const current = sequence[etape]
  const mot = mots[current?.index]

  const handleNext = useCallback((correct) => {
    if (correct) setXp(p => p + 10)
    if (etape + 1 >= sequence.length) {
      setPhase('fin')
    } else {
      setEtape(p => p + 1)
    }
  }, [etape, sequence.length])

  const handleErreur = useCallback(() => {
    if (current) erreursRef.current.push(current.index)
  }, [current])

  if (chargement) return <EcranChargement />
  if (phase === 'intro') return <EcranIntro mots={mots} onStart={() => setPhase('exercice')} />
  if (phase === 'fin') return <EcranFin xp={xp} total={mots.length} navigate={navigate} />
  if (!current || !mot) return null

  if (current.type === 'exposition') {
    return <EcranExposition key={`exp-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={() => handleNext(false)} />
  }

  if (current.type === 'exercice') {
    return <EcranExercice key={`ex-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={handleNext} onErreur={handleErreur} />
  }

  return <EcranRepetition key={`rep-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={handleNext} />
}