import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'
import { getProfileSettings, applyProfileClass } from '../profileSettings'
import { getLangueActive } from '../utils/languages'

function EmojiGeant({ emoji }) {
  if (!emoji) {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="24" fill="#8B5CF6" opacity="0.15"/>
        <circle cx="40" cy="40" r="16" fill="#8B5CF6" opacity="0.2"/>
      </svg>
    )
  }
  return (
    <span style={{ fontSize: '72px', lineHeight: 1, display: 'inline-block' }}>
      {emoji}
    </span>
  )
}

function playWord(word, rate = 0.85) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    const ttsMap = { en: 'en-US', es: 'es-ES', de: 'de-DE', pt: 'pt-PT', it: 'it-IT' }
    u.lang = ttsMap[getLangueActive()] || 'en-US'
    u.rate = rate; u.pitch = 1
    window.speechSynthesis.speak(u)
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function EcranChargement() {
  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Chargement de la leçon...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function EcranIntro({ mots, titreLecon, onStart, settings }) {
  const [index, setIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [audioDebloque, setAudioDebloque] = useState(false)
  const motActuel = mots[index]
  const estDernier = index === mots.length - 1

  useEffect(() => {
    if (audioDebloque && motActuel) setTimeout(() => playWord(motActuel.en, settings.audioRate), 200)
  }, [index, audioDebloque, motActuel, settings.audioRate])

  const debloquerAudioEtJouer = () => {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0.01; window.speechSynthesis.speak(u) }
    setAudioDebloque(true)
    setTimeout(() => playWord(motActuel.en, settings.audioRate), 100)
  }

  const swipeSuivant = () => { if (index < mots.length - 1) setIndex(index + 1) }
  const swipePrecedent = () => { if (index > 0) setIndex(index - 1) }
  const handleTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX) }
  const handleTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX) }
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > 50) swipeSuivant()
    if (distance < -50) swipePrecedent()
  }

  if (!motActuel) return null

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ padding: '52px 0 16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {mots.map((_, i) => (<div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i === 0 ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>))}
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Leçon suivante</p>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', margin: 0, lineHeight: 1.1 }}>{titreLecon}</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
        {mots.map((_, i) => (<div key={i} style={{ width: i === index ? '24px' : '8px', height: '8px', borderRadius: '99px', background: i === index ? '#8B5CF6' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s ease' }}/>))}
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '0 0 24px' }}>Mot {index + 1} sur {mots.length}</p>
      <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '20px 0', minHeight: '380px' }}>
        <div onClick={debloquerAudioEtJouer} style={{ width: '180px', height: '180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 40px rgba(139,92,246,0.18)', transform: 'scale(1.1)' }}>
          {motActuel.svg}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2 style={{ fontSize: '44px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{motActuel.en}</h2>
          <button onClick={debloquerAudioEtJouer} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/><path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '10px 22px' }}>
          <p style={{ fontSize: '18px', color: '#C4B5FD', margin: 0, fontWeight: '500' }}>{motActuel.fr}</p>
        </div>
      </div>
      {index === 0 && (<p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '0 0 16px' }}>← Glisse pour découvrir le mot suivant →</p>)}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={swipePrecedent} disabled={index === 0} style={{ width: '54px', height: '54px', background: index === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.12)', border: index === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(139,92,246,0.25)', borderRadius: '16px', cursor: index === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.4 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4 L5 9 L11 14" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {estDernier ? (
          <button onClick={onStart} style={{ flex: 1, height: '54px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}>Commencer la leçon</button>
        ) : (
          <button onClick={swipeSuivant} style={{ flex: 1, height: '54px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#C4B5FD', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Mot suivant →</button>
        )}
      </div>
    </div>
  )
}

function EcranExposition({ mot, etape, total, onNext, settings }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const DUREE = settings.expositionDuree

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => playWord(mot.en, settings.audioRate), 300)
    const interval = setInterval(() => { setProgress(p => { if (p >= 100) { clearInterval(interval); return 100 } return p + (100 / (DUREE / 50)) }) }, 50)
    const timer = setTimeout(() => onNext(), DUREE)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [mot, onNext, DUREE, settings.audioRate])

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>{Array.from({ length: total }).map((_, i) => (<div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>))}</div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 48px' }}>Nouveau mot</p>
      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: settings.animationsReduites ? 'opacity 0.6s ease' : 'all 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', width: '100%' }}>
        <div onClick={() => playWord(mot.en, settings.audioRate)} style={{ width: '160px', height: '160px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{mot.svg}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '44px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>{mot.en}</h2>
            <button onClick={() => playWord(mot.en, settings.audioRate)} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/><path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '8px 18px' }}>
            <p style={{ fontSize: '18px', color: '#C4B5FD', margin: 0, fontWeight: '500' }}>{mot.fr}</p>
          </div>
        </div>
        <div style={{ width: '120px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.05s linear' }}/>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Écoute simplement...</p>
      </div>
    </div>
  )
}

function EcranExercice({ mot, etape, total, onNext, onErreur, settings }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showNeuri, setShowNeuri] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)
  const choix = useMemo(() => {
    const nbDistracteurs = settings.qcmChoix - 1
    const distracteursMelanges = shuffle(mot.distracteurs).slice(0, nbDistracteurs)
    return shuffle([mot.en, ...distracteursMelanges])
  }, [mot, settings.qcmChoix])

  useEffect(() => {
    setTimeout(() => playWord(mot.en, settings.audioRate), 400)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [mot, settings.audioRate])

  const startCountdown = (seconds) => {
    setCountdown(seconds)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(countdownRef.current); setShowContinue(true); return null } return prev - 1 })
    }, 1000)
  }

  const handleSelect = useCallback((c) => {
    if (selected) return
    setSelected(c)
    const correct = c === mot.en
    setFeedback(correct ? 'correct' : 'wrong')
    if (!correct) onErreur()
    setTimeout(() => setShowNeuri(true), 400)
    startCountdown(correct ? settings.feedbackCorrect : settings.feedbackErreur)
  }, [selected, mot, onErreur, settings])

  const neurColor = feedback === 'correct' ? '#58CC02' : '#8B5CF6'
  const neuriMessage = feedback === 'correct' ? "Bien joué !" : `Presque ! C'était ${mot.en}.`

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>{Array.from({ length: total }).map((_, i) => (<div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>))}</div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 24px' }}>Quel mot entends-tu ?</p>
      <div onClick={() => playWord(mot.en, settings.audioRate)} style={{ width: '130px', height: '130px', background: 'rgba(255,255,255,0.04)', border: feedback === 'correct' ? '1.5px solid rgba(88,204,2,0.4)' : feedback === 'wrong' ? '1.5px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '10px', transition: settings.animationsReduites ? 'border-color 0.5s ease' : 'all 0.3s ease' }}>{mot.svg}</div>
      <button onClick={() => playWord(mot.en, settings.audioRate)} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A78BFA', marginBottom: '24px' }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/><path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Réécouter
      </button>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {choix.map((c) => {
          const isSelected = selected === c
          const isCorrect = feedback && c === mot.en
          const isWrong = feedback === 'wrong' && isSelected && c !== mot.en
          return (
            <div key={c} onClick={() => handleSelect(c)} style={{ background: isCorrect ? 'rgba(88,204,2,0.1)' : isWrong ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '17px 20px', cursor: feedback ? 'default' : 'pointer', transition: settings.animationsReduites ? 'background 0.4s ease' : 'all 0.25s ease' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF', margin: 0, textAlign: 'center' }}>{c}</p>
            </div>
          )
        })}
      </div>
      {showNeuri && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', flexShrink: 0 }}><Neuri3D color={neurColor} /></div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 14px', flex: 1 }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>{neuriMessage}</p>
          </div>
        </div>
      )}
      {feedback && (
        <div style={{ width: '100%' }}>
          {countdown !== null && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: '0 0 6px', textAlign: 'center' }}>Continuer dans {countdown}...</p>
              <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: feedback === 'correct' ? '#58CC02' : '#8B5CF6', borderRadius: '99px', animation: `shrink ${feedback === 'correct' ? settings.feedbackCorrect : settings.feedbackErreur}s linear forwards` }}/>
              </div>
            </div>
          )}
          <button onClick={() => showContinue && onNext(feedback === 'correct')} disabled={!showContinue} style={{ width: '100%', height: '54px', background: !showContinue ? 'rgba(255,255,255,0.06)' : feedback === 'correct' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: !showContinue ? 'rgba(255,255,255,0.25)' : '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: '800', cursor: showContinue ? 'pointer' : 'not-allowed', transition: 'all 0.4s ease' }}>Continuer</button>
          {feedback === 'wrong' && (<p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '12px 0 0' }}>Chaque erreur te fait progresser.</p>)}
        </div>
      )}
      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  )
}

function EcranRepetition({ mot, etape, total, onNext, settings }) {
  const [repetitions, setRepetitions] = useState(0)
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => { setTimeout(() => playWord(mot.en, settings.audioRate), 400) }, [mot, settings.audioRate])

  const handleRepete = () => {
    playWord(mot.en, settings.audioRate)
    const next = repetitions + 1
    setRepetitions(next)
    if (next >= 2) setTimeout(() => setShowContinue(true), 800)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '100%', padding: '52px 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>{Array.from({ length: total }).map((_, i) => (<div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.08)' }}/>))}</div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{etape}/{total}</span>
      </div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 32px' }}>Répète à voix haute</p>
      <div style={{ marginBottom: '20px' }}>{mot.svg}</div>
      <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 8px', textAlign: 'center' }}>{mot.en}</h2>
      <button onClick={() => playWord(mot.en, settings.audioRate)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#A78BFA' }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/><path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Réécouter
      </button>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
        {[0, 1].map(i => (<div key={i} style={{ width: '40px', height: '6px', borderRadius: '99px', background: i < repetitions ? '#8B5CF6' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }}/>))}
      </div>
      {!showContinue && (
        <button onClick={handleRepete} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}>
          {repetitions === 0 ? "Je l'ai dit" : 'Encore une fois'}
        </button>
      )}
      <div style={{ width: '100%', opacity: showContinue ? 1 : 0, transform: showContinue ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease', pointerEvents: showContinue ? 'auto' : 'none' }}>
        <button onClick={() => onNext(true)} style={{ width: '100%', height: '54px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: '800', cursor: 'pointer' }}>Continuer</button>
      </div>
    </div>
  )
}

function EcranFin({ xp, total, leconId, navigate, mots, partieCompletee, objectifMinutes }) {
  const [sauvegarde, setSauvegarde] = useState('en_cours')

  useEffect(() => {
    async function sauvegarder() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSauvegarde('erreur'); return }
        await supabase.from('progression').upsert({ user_id: user.id, lecon_id: leconId, partie_completee: partieCompletee, completee_le: new Date().toISOString() }, { onConflict: 'user_id,lecon_id' })
        const { data: profil } = await supabase.from('profils').select('xp, mots_appris, lecons_completees').eq('user_id', user.id).single()
        if (profil) {
          const update = { xp: profil.xp + xp, mots_appris: profil.mots_appris + total }
          // Ne compter la leçon comme complétée que si tous les mots sont vus (partie 2 ou mode 10 min)
          if (partieCompletee === 2) {
            update.lecons_completees = profil.lecons_completees + 1
          }
          await supabase.from('profils').update(update).eq('user_id', user.id)
        }
        setSauvegarde('ok')
      } catch { setSauvegarde('erreur') }
    }
    sauvegarder()
  }, [xp, total, leconId, partieCompletee])

  const leconTerminee = partieCompletee === 2
  const titre = leconTerminee ? 'Leçon terminée !' : 'Partie 1 terminée !'
  const sousTitre = leconTerminee 
    ? 'Ton cerveau a bien travaillé.' 
    : 'Reviens demain pour la suite.'

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.15) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ width: '80px', height: '80px', background: 'rgba(88,204,2,0.15)', border: '1px solid rgba(88,204,2,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M8 20 L16 28 L32 12" stroke="#58CC02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px' }}>{titre}</h1>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 32px' }}>{sousTitre}</p>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', width: '100%' }}>
        {[{ label: 'Mots appris', value: `${total}/${total}`, color: '#58CC02' }, { label: 'XP gagnés', value: `+${xp}`, color: '#8B5CF6' }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '26px', fontWeight: '900', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div style={{ width: '100%', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mots appris aujourd'hui</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {mots && mots.map((m, i) => (
            <div key={i} style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '6px 14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#C4B5FD' }}>{m.en}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>{m.fr}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {sauvegarde === 'en_cours' && (<><div style={{ width: '12px', height: '12px', border: '2px solid rgba(139,92,246,0.3)', borderTop: '2px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/><p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Sauvegarde en cours...</p></>)}
        {sauvegarde === 'ok' && (<><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="rgba(88,204,2,0.2)"/><path d="M4 7 L6 9 L10 5" stroke="#58CC02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg><p style={{ fontSize: '12px', color: 'rgba(88,204,2,0.7)', margin: 0 }}>Progression sauvegardée ✓</p></>)}
        {sauvegarde === 'erreur' && (<p style={{ fontSize: '12px', color: 'rgba(245,158,11,0.6)', margin: 0 }}>Non connecté — progression non sauvegardée</p>)}
      </div>
      <button onClick={() => navigate('/dashboard')} disabled={sauvegarde === 'en_cours'} style={{ width: '100%', height: '54px', background: sauvegarde === 'en_cours' ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #58CC02, #3DAD00)', color: sauvegarde === 'en_cours' ? 'rgba(255,255,255,0.25)' : 'white', border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: '800', cursor: sauvegarde === 'en_cours' ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}>Continuer</button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function Lesson() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leconId = searchParams.get('lecon')
  const [phase, setPhase] = useState('intro')
  const [xp, setXp] = useState(0)
  const [mots, setMots] = useState([])
  const [titreLecon, setTitreLecon] = useState('')
  const [chargement, setChargement] = useState(true)
  const [settings, setSettings] = useState(getProfileSettings('tdah'))
  const [objectifMinutes, setObjectifMinutes] = useState(5)
  const [partieCourante, setPartieCourante] = useState(1) // 1 = mots 1-5, 2 = mots 6-10
  const erreursRef = useRef([])

  useEffect(() => {
    async function chargerProfilEtMots() {
      const { data: { user } } = await supabase.auth.getUser()
      let dureeUser = 5
      if (user) {
        const { data: profil } = await supabase.from('profils').select('profil_type, objectif_minutes').eq('user_id', user.id).single()
        if (profil?.profil_type) {
          setSettings(getProfileSettings(profil.profil_type))
          applyProfileClass(profil.profil_type)
        }
        dureeUser = profil?.objectif_minutes || 5
        setObjectifMinutes(dureeUser)
      }

      let lecon = null
      if (leconId) {
        const { data } = await supabase.from('lecons').select('id, titre').eq('id', leconId).single()
        lecon = data
      } else {
        const { data } = await supabase.from('lecons').select('id, titre').order('ordre').limit(1).single()
        lecon = data
      }
      if (!lecon) { setChargement(false); return }
      setTitreLecon(lecon.titre)

      // Déterminer la partie à afficher en mode 5 min
      let partie = 1
      if (user && dureeUser === 5) {
        const { data: prog } = await supabase
          .from('progression')
          .select('partie_completee')
          .eq('user_id', user.id)
          .eq('lecon_id', lecon.id)
          .maybeSingle()
        // Si partie 1 déjà faite → on attaque la 2
        if (prog?.partie_completee === 1) partie = 2
      }
      setPartieCourante(partie)

      const { data, error } = await supabase.from('mots').select('*').eq('lecon_id', lecon.id).order('ordre')
      if (!error && data) {
        // Filtrer selon le mode
        let motsFiltres = data
        if (dureeUser === 5) {
          // Mode 5 min : 5 mots (partie 1 = ordre 1-5, partie 2 = ordre 6-10)
          motsFiltres = data.filter(m => partie === 1 ? m.ordre <= 5 : m.ordre >= 6)
        }
        // Mode 10 min : on prend tous les mots (1-10)

        setMots(motsFiltres.map(m => ({ id: m.id, en: m.mot_en, fr: m.mot_fr, distracteurs: [m.distracteur_1, m.distracteur_2, m.distracteur_3].filter(Boolean), svg: <EmojiGeant emoji={m.image_url} /> })))
      }
      setChargement(false)
    }
    chargerProfilEtMots()
  }, [leconId])

  const sequence = useMemo(() => {
    const indices = mots.map((_, i) => i)
    const repetitionIndices = indices.slice(0, 3)
    return [
      ...mots.map((_, i) => ({ type: 'exposition', index: i })),
      ...mots.map((_, i) => ({ type: 'exercice', index: i })),
      ...repetitionIndices.map(i => ({ type: 'repetition', index: i })),
    ]
  }, [mots])

  const [etape, setEtape] = useState(0)
  const current = sequence[etape]
  const mot = mots[current?.index]

  const handleNext = useCallback((correct) => {
    if (correct) setXp(p => p + 10)
    if (etape + 1 >= sequence.length) { setPhase('fin') } else { setEtape(p => p + 1) }
  }, [etape, sequence.length])

  const handleErreur = useCallback(() => { if (current) erreursRef.current.push(current.index) }, [current])

  // Calcul de la partie complétée à enregistrer
  const partieCompleteeFinale = objectifMinutes === 10 ? 2 : (partieCourante === 1 ? 1 : 2)

  if (chargement) return <EcranChargement />
  if (phase === 'intro') return <EcranIntro mots={mots} titreLecon={titreLecon} onStart={() => setPhase('exercice')} settings={settings} />
  if (phase === 'fin') return <EcranFin xp={xp} total={mots.length} leconId={leconId} navigate={navigate} mots={mots} partieCompletee={partieCompleteeFinale} objectifMinutes={objectifMinutes} />
  if (!current || !mot) return null
  if (current.type === 'exposition') return <EcranExposition key={`exp-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={() => handleNext(false)} settings={settings} />
  if (current.type === 'exercice') return <EcranExercice key={`ex-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={handleNext} onErreur={handleErreur} settings={settings} />
  return <EcranRepetition key={`rep-${etape}`} mot={mot} etape={etape + 1} total={sequence.length} onNext={handleNext} settings={settings} />
}