import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Neuri3D from '../components/Neuri3D'

const ILLUS = {
  apple: (s = 80) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <path d="M40 12 C40 12 36 6 30 7 C30 7 34 12 40 12Z" fill="#4CAF50"/>
      <path d="M38 10 C38 10 36 4 40 2 C40 2 44 6 38 10Z" fill="#66BB6A"/>
      <path d="M20 25 C15 30 13 38 14 46 C15 58 22 68 32 72 C36 74 40 74 44 72 C48 70 52 70 56 72 C60 74 64 74 68 70 C74 64 78 54 76 44 C74 34 68 26 60 23 C55 21 50 22 46 25 C44 26 42 27 40 27 C38 27 36 26 34 25 C30 22 25 22 20 25Z" fill="#F44336"/>
      <ellipse cx="28" cy="38" rx="5" ry="8" fill="white" opacity="0.25" transform="rotate(-20 28 38)"/>
    </svg>
  ),
  banane: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M10 45 C10 45 15 20 35 15 C50 12 55 20 52 30 C49 40 35 45 20 48 C15 49 10 47 10 45Z" fill="#FDD835"/>
    </svg>
  ),
  orange: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="32" r="22" fill="#FF7043"/>
      <path d="M30 10 C30 10 27 6 30 4 C33 6 30 10 30 10Z" fill="#4CAF50"/>
    </svg>
  ),
  raisin: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="22" cy="22" r="8" fill="#7B1FA2"/>
      <circle cx="38" cy="22" r="8" fill="#7B1FA2"/>
      <circle cx="18" cy="36" r="8" fill="#6A1B9A"/>
      <circle cx="42" cy="36" r="8" fill="#6A1B9A"/>
      <circle cx="30" cy="30" r="8" fill="#8E24AA"/>
      <circle cx="30" cy="46" r="8" fill="#6A1B9A"/>
    </svg>
  ),
  cat: (s = 80) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <path d="M15 20 L20 35 C14 40 12 48 14 56 C16 64 24 70 32 72 C36 73 44 73 48 72 C56 70 64 64 66 56 C68 48 66 40 60 35 L65 20 L52 30 C48 27 44 26 40 26 C36 26 32 27 28 30 Z" fill="#90A4AE"/>
      <ellipse cx="32" cy="52" rx="5" ry="6" fill="#1A237E"/>
      <ellipse cx="48" cy="52" rx="5" ry="6" fill="#1A237E"/>
      <ellipse cx="32" cy="52" rx="2" ry="5" fill="black"/>
      <ellipse cx="48" cy="52" rx="2" ry="5" fill="black"/>
      <path d="M35 60 C35 60 38 62 40 62 C42 62 45 60 45 60" stroke="#E91E63" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="40" cy="60" r="2" fill="#F48FB1"/>
    </svg>
  ),
  dog: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <ellipse cx="30" cy="35" rx="20" ry="16" fill="#BCAAA4"/>
      <circle cx="30" cy="22" r="14" fill="#BCAAA4"/>
      <ellipse cx="20" cy="16" rx="5" ry="8" fill="#A1887F" transform="rotate(-15 20 16)"/>
      <ellipse cx="40" cy="16" rx="5" ry="8" fill="#A1887F" transform="rotate(15 40 16)"/>
      <ellipse cx="24" cy="24" rx="4" ry="5" fill="#5D4037"/>
      <ellipse cx="36" cy="24" rx="4" ry="5" fill="#5D4037"/>
    </svg>
  ),
  rabbit: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <ellipse cx="30" cy="38" rx="16" ry="14" fill="#F5F5F5"/>
      <circle cx="30" cy="24" r="12" fill="#F5F5F5"/>
      <ellipse cx="23" cy="10" rx="4" ry="10" fill="#F5F5F5"/>
      <ellipse cx="37" cy="10" rx="4" ry="10" fill="#F5F5F5"/>
      <ellipse cx="25" cy="25" rx="3.5" ry="4" fill="#90CAF9"/>
      <ellipse cx="35" cy="25" rx="3.5" ry="4" fill="#90CAF9"/>
    </svg>
  ),
  bird: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <ellipse cx="30" cy="36" rx="16" ry="12" fill="#42A5F5"/>
      <circle cx="30" cy="22" r="12" fill="#42A5F5"/>
      <path d="M26 24 L22 26 L26 28 Z" fill="#FF8F00"/>
    </svg>
  ),
  water: (s = 80) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <path d="M40 8 C40 8 20 30 20 46 C20 58 29 68 40 68 C51 68 60 58 60 46 C60 30 40 8 40 8Z" fill="#29B6F6"/>
    </svg>
  ),
  fire: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M30 8 C30 8 22 18 22 28 C22 36 26 40 30 42 C34 40 38 36 38 28 C38 18 30 8 30 8Z" fill="#FF6F00"/>
      <path d="M30 20 C30 20 25 28 26 34 C27 38 28 40 30 41 C32 40 33 38 34 34 C35 28 30 20 30 20Z" fill="#FFCA28"/>
    </svg>
  ),
  wind: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M8 20 C8 20 20 18 28 22 C34 25 34 32 28 34 C22 36 18 32 20 28" stroke="#90CAF9" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M8 30 C8 30 30 28 38 32 C44 35 44 42 38 44 C32 46 28 42 30 38" stroke="#64B5F6" strokeWidth="3" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  earth: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="22" fill="#1565C0"/>
      <path d="M14 22 C16 18 20 16 24 18 C26 19 26 22 24 24 C22 26 18 26 16 28 C14 30 14 34 16 36" fill="#388E3C"/>
      <path d="M32 12 C36 10 42 12 44 16 C46 20 44 24 40 26" fill="#43A047"/>
    </svg>
  ),
  sun: (s = 80) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line key={i}
          x1={40 + 26 * Math.cos(angle * Math.PI / 180)}
          y1={40 + 26 * Math.sin(angle * Math.PI / 180)}
          x2={40 + 36 * Math.cos(angle * Math.PI / 180)}
          y2={40 + 36 * Math.sin(angle * Math.PI / 180)}
          stroke="#FFB300" strokeWidth="3" strokeLinecap="round"
        />
      ))}
      <circle cx="40" cy="40" r="20" fill="#FFD600"/>
    </svg>
  ),
  moon: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M38 10 C28 12 20 20 20 30 C20 42 30 50 42 48 C34 46 28 38 28 30 C28 20 34 14 38 10Z" fill="#FDD835"/>
    </svg>
  ),
  star: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M30 8 L34 22 L48 22 L37 31 L41 45 L30 36 L19 45 L23 31 L12 22 L26 22 Z" fill="#FFD600"/>
    </svg>
  ),
  cloud: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="22" cy="32" r="10" fill="#ECEFF1"/>
      <circle cx="34" cy="28" r="13" fill="#ECEFF1"/>
      <circle cx="46" cy="33" r="9" fill="#ECEFF1"/>
    </svg>
  ),
  hello: (s = 80) => (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="32" r="18" fill="#FFCC02"/>
      <ellipse cx="33" cy="28" rx="3" ry="4" fill="#1A237E"/>
      <ellipse cx="47" cy="28" rx="3" ry="4" fill="#1A237E"/>
      <path d="M33 38 C33 38 36 42 40 42 C44 42 47 38 47 38" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M56 18 C56 18 64 14 66 8 C66 8 70 16 64 20 C60 22 56 20 56 18Z" fill="#FFCC02"/>
    </svg>
  ),
  goodbye: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="24" r="14" fill="#FFCC02"/>
      <ellipse cx="25" cy="21" rx="2.5" ry="3" fill="#1A237E"/>
      <ellipse cx="35" cy="21" rx="2.5" ry="3" fill="#1A237E"/>
      <path d="M42 14 L48 10 M44 18 L52 18 M42 22 L48 26" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  thanks: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="24" r="14" fill="#FF8A65"/>
      <ellipse cx="25" cy="21" rx="2.5" ry="3" fill="#1A237E"/>
      <ellipse cx="35" cy="21" rx="2.5" ry="3" fill="#1A237E"/>
    </svg>
  ),
  yes: (s = 60) => (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="22" fill="#66BB6A"/>
      <path d="M18 30 L26 38 L42 22" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

const MOTS = [
  { id: 'apple', en: 'Apple', fr: 'Pomme', illu: 'apple',
    distracteurs: [
      { id: 'banana', en: 'Banana', fr: 'Banane', illu: 'banane' },
      { id: 'orange', en: 'Orange', fr: 'Orange', illu: 'orange' },
      { id: 'grape', en: 'Grape', fr: 'Raisin', illu: 'raisin' },
    ]},
  { id: 'cat', en: 'Cat', fr: 'Chat', illu: 'cat',
    distracteurs: [
      { id: 'dog', en: 'Dog', fr: 'Chien', illu: 'dog' },
      { id: 'rabbit', en: 'Rabbit', fr: 'Lapin', illu: 'rabbit' },
      { id: 'bird', en: 'Bird', fr: 'Oiseau', illu: 'bird' },
    ]},
  { id: 'water', en: 'Water', fr: 'Eau', illu: 'water',
    distracteurs: [
      { id: 'fire', en: 'Fire', fr: 'Feu', illu: 'fire' },
      { id: 'wind', en: 'Wind', fr: 'Vent', illu: 'wind' },
      { id: 'earth', en: 'Earth', fr: 'Terre', illu: 'earth' },
    ]},
  { id: 'sun', en: 'Sun', fr: 'Soleil', illu: 'sun',
    distracteurs: [
      { id: 'moon', en: 'Moon', fr: 'Lune', illu: 'moon' },
      { id: 'star', en: 'Star', fr: 'Étoile', illu: 'star' },
      { id: 'cloud', en: 'Cloud', fr: 'Nuage', illu: 'cloud' },
    ]},
  { id: 'hello', en: 'Hello', fr: 'Bonjour', illu: 'hello',
    distracteurs: [
      { id: 'goodbye', en: 'Goodbye', fr: 'Au revoir', illu: 'goodbye' },
      { id: 'thanks', en: 'Thanks', fr: 'Merci', illu: 'thanks' },
      { id: 'yes', en: 'Yes', fr: 'Oui', illu: 'yes' },
    ]},
]

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

function playTap() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(520, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

function EcranExposition({ mot, onNext }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    const audioTimer = setTimeout(() => playWord(mot.en), 500)
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 2))
    }, 60)
    const nextTimer = setTimeout(() => onNext(), 3200)
    return () => {
      clearTimeout(audioTimer)
      clearTimeout(nextTimer)
      clearInterval(interval)
    }
  }, [mot.en, onNext])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '24px', padding: '40px 20px' }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
        Nouveau mot
      </p>
      <div style={{ width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>
        {ILLUS[mot.illu](100)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => playWord(mot.en)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
            <path d="M11 5.5C12.5 6.8 13.5 8.3 13.5 9C13.5 9.7 12.5 11.2 11 12.5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '36px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
          {mot.en}
        </p>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'rgba(167,139,250,0.7)', margin: 0, fontWeight: '500' }}>
        ({mot.fr})
      </p>
      <div style={{ width: '140px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: '99px', transition: 'width 0.1s linear' }}/>
      </div>
    </div>
  )
}

function EcranExercice({ mot, type, onNext, onAnswer, setNeurColor }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showContinue, setShowContinue] = useState(false)

  const choix = useMemo(() => {
    if (type === 'recognition') {
      return shuffle([
        { id: mot.id, labelEn: mot.en, correct: true },
        ...mot.distracteurs.slice(0, 2).map(d => ({ id: d.id, labelEn: d.en, correct: false })),
      ])
    }
    if (type === 'audio') {
      return shuffle([
        { id: mot.id, labelEn: mot.en, illu: mot.illu, correct: true },
        ...mot.distracteurs.slice(0, 2).map(d => ({ id: d.id, labelEn: d.en, illu: d.illu, correct: false })),
      ])
    }
    return shuffle([
      { id: mot.id, labelEn: mot.en, illu: mot.illu, correct: true },
      ...mot.distracteurs.map(d => ({ id: d.id, labelEn: d.en, illu: d.illu, correct: false })),
    ])
  }, [mot, type])

  const consigne = type === 'recognition' ? 'Touche le bon mot' : 'Touche la bonne image'

  useEffect(() => {
    if (type === 'audio') {
      const t = setTimeout(() => playWord(mot.en), 400)
      return () => clearTimeout(t)
    }
  }, [type, mot.en])

  const handleSelect = useCallback((item) => {
    if (selected !== null) return
    setSelected(item.id)
    playTap()
    if (navigator.vibrate) navigator.vibrate([10, 20, 8])
    const correct = item.correct
    setFeedback(correct ? 'correct' : 'wrong')
    setNeurColor(correct ? '#58CC02' : '#F59E0B')
    onAnswer(correct)
    const delay = correct ? 1500 : 2200
    setTimeout(() => setShowContinue(true), delay)
  }, [selected, setNeurColor, onAnswer])

  const bonne = choix.find(c => c.correct)
  const isGrille = type === 'audio' || type === 'reinforce'
  const gridCols = type === 'reinforce' ? '1fr 1fr' : 'repeat(3, 1fr)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '14px', padding: '8px 0' }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>
        {consigne}
      </p>

      {type === 'recognition' && (
        <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ILLUS[mot.illu](80)}
        </div>
      )}

      {type === 'audio' && (
        <button onClick={() => playWord(mot.en)} style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 24px rgba(139,92,246,0.2)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 11H2V21H6L12 26V6L6 11Z" fill="#A78BFA"/>
            <path d="M18 10C21 12.5 23 14.8 23 16C23 17.2 21 19.5 18 22" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {type === 'reinforce' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => playWord(mot.en)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M3 6H1V12H3L7 15V3L3 6Z" fill="#A78BFA"/>
            </svg>
          </button>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 20px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
              {mot.en}
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div style={{ background: feedback === 'correct' ? 'rgba(88,204,2,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${feedback === 'correct' ? 'rgba(88,204,2,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '12px', padding: '8px 16px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: feedback === 'correct' ? '#86EFAC' : '#FCD34D', margin: 0, textAlign: 'center' }}>
            {feedback === 'correct' ? 'Bravo ! ✨' : `C'était : ${bonne.labelEn}`}
          </p>
        </div>
      )}

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: isGrille ? gridCols : '1fr', gap: '10px' }}>
        {choix.map((c) => {
          const isSelected = selected === c.id
          const showCorrect = feedback && c.correct
          const showWrong = feedback === 'wrong' && isSelected
          return (
            <div key={c.id} onClick={() => handleSelect(c)} role="button" tabIndex={0}
              style={{
                background: showCorrect ? 'rgba(88,204,2,0.15)' : showWrong ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: showCorrect ? '2px solid rgba(88,204,2,0.6)' : showWrong ? '2px solid rgba(245,158,11,0.6)' : isSelected ? '2px solid rgba(139,92,246,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: isGrille ? '14px 8px' : '16px 20px',
                cursor: feedback ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: isGrille ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: isGrille ? 'center' : 'flex-start',
                gap: isGrille ? '8px' : '12px',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                userSelect: 'none',
              }}>
              {isGrille && c.illu && ILLUS[c.illu] && (
                <div style={{ opacity: showWrong ? 0.45 : 1, transition: 'opacity 0.2s' }}>
                  {ILLUS[c.illu](type === 'reinforce' ? 52 : 44)}
                </div>
              )}
              <p style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: isGrille ? '13px' : '18px',
                fontWeight: '700',
                color: showCorrect ? '#86EFAC' : showWrong ? '#FCD34D' : '#FFFFFF',
                margin: 0,
                textAlign: 'center',
              }}>
                {c.labelEn}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ width: '100%', opacity: showContinue ? 1 : 0, transform: showContinue ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.4s ease', pointerEvents: showContinue ? 'auto' : 'none', marginTop: '4px' }}>
        <button onClick={onNext} style={{
          width: '100%',
          background: feedback === 'correct' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: 'white', border: 'none', borderRadius: '16px', padding: '16px',
          fontSize: '16px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer',
        }}>
          Continuer
        </button>
      </div>
    </div>
  )
}

export default function Lesson() {
  const sequenceInitiale = useMemo(() => {
    return [
      ...MOTS.map(m => ({ motId: m.id, type: 'exposition', rattrapage: false })),
      ...shuffle(MOTS).map(m => ({ motId: m.id, type: 'recognition', rattrapage: false })),
      ...shuffle(MOTS).map(m => ({ motId: m.id, type: 'audio', rattrapage: false })),
      ...shuffle(MOTS).map(m => ({ motId: m.id, type: 'reinforce', rattrapage: false })),
    ]
  }, [])

  const [sequence, setSequence] = useState(sequenceInitiale)
  const [etape, setEtape] = useState(0)
  const [neurColor, setNeurColor] = useState('#8B5CF6')
  const [completed, setCompleted] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const erreursRef = useRef(new Set())

  const current = sequence[etape]
  const mot = MOTS.find(m => m.id === current?.motId)
  const motsUniquesVus = [...new Set(sequence.slice(0, etape + 1).map(s => s.motId))]
  const numMotActuel = motsUniquesVus.length
  const progression = ((etape + 1) / sequence.length) * 100

  const handleAnswer = useCallback((correct) => {
    if (correct) {
      setXpGained(p => p + 10)
    } else if (!current.rattrapage) {
      const key = `${current.motId}-${current.type}`
      if (!erreursRef.current.has(key)) {
        erreursRef.current.add(key)
        setSequence(prev => [...prev, { motId: current.motId, type: current.type, rattrapage: true }])
      }
    }
  }, [current])

  const handleNext = useCallback(() => {
    setNeurColor('#8B5CF6')
    if (etape + 1 >= sequence.length) {
      setCompleted(true)
    } else {
      setEtape(p => p + 1)
    }
  }, [etape, sequence.length])

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(88,204,2,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ width: '180px', height: '180px', marginBottom: '24px' }}>
          <Neuri3D color="#58CC02" />
        </div>
        <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '32px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 12px' }}>
          Leçon terminée !
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 40px' }}>
          Bravo, tu as appris {MOTS.length} nouveaux mots 🌟
        </p>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
          {[
            { label: 'XP gagnés', value: `+${xpGained}`, color: '#8B5CF6' },
            { label: 'Mots appris', value: `${MOTS.length}`, color: '#58CC02' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 28px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '28px', fontWeight: '900', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => window.history.back()} style={{ width: '100%', maxWidth: '340px', background: 'linear-gradient(135deg, #58CC02, #3DAD00)', color: 'white', border: 'none', borderRadius: '16px', padding: '18px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer' }}>
          Retour au dashboard
        </button>
      </div>
    )
  }

  const isExposition = current?.type === 'exposition'

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.12) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', padding: '0 20px 32px', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '52px 0 16px' }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 10H5M5 10L9 6M5 10L9 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: `${progression}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #58CC02)', borderRadius: '99px', transition: 'width 0.5s ease' }}/>
        </div>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>
          {numMotActuel}/{MOTS.length}
        </span>
      </div>

      {current?.rattrapage && (
        <div style={{ alignSelf: 'center', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '6px 14px', marginBottom: '8px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#FCD34D', margin: 0, fontWeight: '500' }}>
            2ème essai — tu vas y arriver
          </p>
        </div>
      )}

      {!isExposition && (
        <div style={{ width: '100px', height: '100px', margin: '0 auto 4px' }}>
          <Neuri3D color={neurColor} />
        </div>
      )}

      {isExposition ? (
        <EcranExposition key={`exp-${etape}`} mot={mot} onNext={handleNext} />
      ) : (
        <EcranExercice key={`ex-${etape}`} mot={mot} type={current.type} onNext={handleNext} onAnswer={handleAnswer} setNeurColor={setNeurColor} />
      )}
    </div>
  )
}