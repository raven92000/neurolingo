import { useState, useEffect, useMemo } from 'react'
import Neuri3D from '../components/Neuri3D'
import { getLangueActive } from '../utils/languages'

const config = {
  tdah: {
    maxChoices: 2,
    highlightWords: false,
    fontSize: '32px',
    transitionMs: 200,
    wordGap: '8px',
  },
  dyslexie: {
    maxChoices: 3,
    highlightWords: true,
    fontSize: '36px',
    transitionMs: 500,
    wordGap: '16px',
  },
}

function playSentence(text, rate = 0.85) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const ttsMap = { en: 'en-US', es: 'es-ES', de: 'de-DE', pt: 'pt-PT', it: 'it-IT' }
    u.lang = ttsMap[getLangueActive()] || 'en-US'
    u.rate = rate
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

function PhraseAffichee({ mots, settings }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: settings.wordGap, padding: '0 12px' }}>
      {mots.map((mot, i) => (
        <span
          key={i}
          style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: settings.fontSize,
            fontWeight: '900',
            color: '#FFFFFF',
            padding: settings.highlightWords ? '4px 10px' : '0',
            background: settings.highlightWords ? 'rgba(255,255,255,0.04)' : 'transparent',
            borderRadius: settings.highlightWords ? '10px' : '0',
          }}
        >
          {mot}
        </span>
      ))}
    </div>
  )
}

function BoutonGrosPlay({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      background: 'rgba(139,92,246,0.15)',
      border: '2px solid rgba(139,92,246,0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 30px rgba(139,92,246,0.3)',
      fontSize: '32px',
    }}>
      🔊
    </button>
  )
}

function BoutonContinuer({ onClick, label = 'Continuer', color = '#7C3AED' }) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      height: '56px',
      background: color === '#58CC02' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '16px',
      fontSize: '17px',
      fontWeight: '800',
      fontFamily: 'Nunito, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 0 28px rgba(124,58,237,0.35)',
      marginTop: '16px',
    }}>
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 1 — EXPOSITION
// ═══════════════════════════════════════════════════════════════
function EtapeExposition({ phrase, settings, onNext }) {
  const mots = phrase.en.split(' ')

  useEffect(() => {
    setTimeout(() => playSentence(phrase.en), 300)
  }, [phrase.en])

  return (
    <div style={containerStyle}>
      <p style={labelStyle}>Écoute la phrase</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '28px' }}>
        <BoutonGrosPlay onClick={() => playSentence(phrase.en)} />
        <PhraseAffichee mots={mots} settings={settings} />
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '12px 24px' }}>
          <p style={{ fontSize: '18px', color: '#C4B5FD', margin: 0, fontWeight: '500' }}>{phrase.fr}</p>
        </div>
      </div>
      <BoutonContinuer onClick={onNext} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 2 — COMPRÉHENSION
// ═══════════════════════════════════════════════════════════════
function EtapeComprehension({ phrase, settings, onNext, onErreur }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const choix = useMemo(() => {
    const all = [phrase.fr, ...phrase.distracteursPhrase].slice(0, settings.maxChoices)
    return shuffle(all)
  }, [phrase, settings.maxChoices])

  useEffect(() => {
    setTimeout(() => playSentence(phrase.en), 300)
  }, [phrase.en])

  const handleSelect = (c) => {
    if (selected) return
    setSelected(c)
    const correct = c === phrase.fr
    setFeedback(correct ? 'correct' : 'wrong')
    if (!correct) onErreur?.()
  }

  return (
    <div style={containerStyle}>
      <p style={labelStyle}>Que signifie cette phrase ?</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <BoutonGrosPlay onClick={() => playSentence(phrase.en)} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        {choix.map((c) => {
          const isSelected = selected === c
          const isCorrect = feedback && c === phrase.fr
          const isWrong = feedback === 'wrong' && isSelected && c !== phrase.fr
          return (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              disabled={!!feedback}
              style={{
                ...choiceButtonStyle,
                background: isCorrect ? 'rgba(88,204,2,0.15)' : isWrong ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF',
                transition: `all ${settings.transitionMs}ms ease`,
              }}
            >
              {c}
            </button>
          )
        })}
      </div>
      {feedback && <BoutonContinuer onClick={() => onNext(feedback === 'correct')} color={feedback === 'correct' ? '#58CC02' : '#7C3AED'} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 3 — RECONSTRUCTION
// ═══════════════════════════════════════════════════════════════
function EtapeReconstruction({ phrase, settings, onNext, onErreur }) {
  const motsCorrects = phrase.en.split(' ')
  const [bank, setBank] = useState(() => shuffle(motsCorrects.map((m, i) => ({ id: i, mot: m }))))
  const [reponse, setReponse] = useState([])
  const [feedback, setFeedback] = useState(null)

  const ajouter = (item) => {
    if (feedback) return
    setReponse([...reponse, item])
    setBank(bank.filter((b) => b.id !== item.id))
  }

  const retirer = (item, index) => {
    if (feedback) return
    setReponse(reponse.filter((_, i) => i !== index))
    setBank([...bank, item])
  }

  const valider = () => {
    const phraseConstruite = reponse.map((r) => r.mot).join(' ')
    const correct = phraseConstruite === phrase.en
    setFeedback(correct ? 'correct' : 'wrong')
    if (!correct) onErreur?.()
    if (correct) {
      playSentence(phrase.en)
      setTimeout(() => onNext(true), 1000) // passe automatiquement après 1s
    }
  }

  const reset = () => {
    setBank(shuffle(motsCorrects.map((m, i) => ({ id: i, mot: m }))))
    setReponse([])
    setFeedback(null)
  }

  const peutValider = reponse.length === motsCorrects.length && !feedback

  return (
    <div style={containerStyle}>
      <p style={labelStyle}>Reconstitue la phrase</p>
      <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 20px' }}>{phrase.fr}</p>

      <div style={{
        minHeight: '90px',
        background: feedback === 'correct' ? 'rgba(88,204,2,0.1)' : feedback === 'wrong' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
        border: feedback === 'correct' ? '2px solid rgba(88,204,2,0.4)' : feedback === 'wrong' ? '2px solid rgba(245,158,11,0.4)' : '1.5px dashed rgba(255,255,255,0.15)',
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: settings.wordGap,
        marginBottom: '20px',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `all ${settings.transitionMs}ms ease`,
      }}>
        {reponse.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>Tape les mots ci-dessous ↓</p>
        )}
        {reponse.map((item, i) => (
          <button key={`r-${item.id}`} onClick={() => retirer(item, i)} style={wordChipStyle(settings, true)}>
            {item.mot}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: settings.wordGap, justifyContent: 'center', flex: 1, alignContent: 'flex-start', marginBottom: '12px' }}>
        {bank.map((item) => (
          <button key={`b-${item.id}`} onClick={() => ajouter(item)} style={wordChipStyle(settings, false)}>
            {item.mot}
          </button>
        ))}
      </div>

      {!feedback && peutValider && <BoutonContinuer onClick={valider} label="Valider" />}
      {feedback === 'wrong' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={reset} style={{ flex: 1, height: '54px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Réessayer</button>
          <button onClick={() => onNext(false)} style={{ flex: 1, height: '54px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFFFFF', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>Continuer</button>
        </div>
      )}
      {feedback === 'correct' && <BoutonContinuer onClick={() => onNext(true)} color="#58CC02" />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 4 — PHRASE À TROU
// ═══════════════════════════════════════════════════════════════
function EtapePhraseTrou({ phrase, settings, onNext, onErreur }) {
  const mots = phrase.en.split(' ')
  const indexCache = phrase.indexCache ?? 1
  const motCache = mots[indexCache]
  const motsAvant = mots.slice(0, indexCache)
  const motsApres = mots.slice(indexCache + 1)

  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const choix = useMemo(() => {
    const all = [motCache, ...phrase.distracteursMot.slice(0, settings.maxChoices - 1)]
    return shuffle(all)
  }, [phrase, motCache, settings.maxChoices])

  useEffect(() => {
    setTimeout(() => playSentence(phrase.en), 300)
  }, [phrase.en])

  const handleSelect = (c) => {
    if (selected) return
    setSelected(c)
    const correct = c === motCache
    setFeedback(correct ? 'correct' : 'wrong')
    if (!correct) onErreur?.()
    if (correct) setTimeout(() => playSentence(phrase.en), 200)
  }

  return (
    <div style={containerStyle}>
      <p style={labelStyle}>Complète la phrase</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <BoutonGrosPlay onClick={() => playSentence(phrase.en)} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: settings.wordGap }}>
          {motsAvant.map((m, i) => (
            <span key={`a-${i}`} style={{ fontSize: settings.fontSize, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Nunito' }}>{m}</span>
          ))}
          <span style={{
            display: 'inline-block',
            minWidth: '100px',
            padding: '4px 18px',
            borderBottom: feedback === 'correct' ? '3px solid #58CC02' : feedback === 'wrong' ? '3px solid #F59E0B' : '3px solid #8B5CF6',
            color: feedback === 'correct' ? '#86EFAC' : feedback === 'wrong' ? '#FCD34D' : '#A78BFA',
            fontSize: settings.fontSize,
            fontWeight: '900',
            fontFamily: 'Nunito',
            textAlign: 'center',
            transition: `all ${settings.transitionMs}ms ease`,
          }}>
            {selected || '___'}
          </span>
          {motsApres.map((m, i) => (
            <span key={`p-${i}`} style={{ fontSize: settings.fontSize, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Nunito' }}>{m}</span>
          ))}
        </div>
        <p style={{ fontSize: '15px', color: '#C4B5FD', textAlign: 'center', margin: 0 }}>{phrase.fr}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {choix.map((c) => {
          const isSelected = selected === c
          const isCorrect = feedback && c === motCache
          const isWrong = feedback === 'wrong' && isSelected && c !== motCache
          return (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              disabled={!!feedback}
              style={{
                ...choiceButtonStyle,
                background: isCorrect ? 'rgba(88,204,2,0.15)' : isWrong ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF',
                transition: `all ${settings.transitionMs}ms ease`,
              }}
            >
              {c}
            </button>
          )
        })}
      </div>
      {feedback && <BoutonContinuer onClick={() => onNext(feedback === 'correct')} label="Terminer" color={feedback === 'correct' ? '#58CC02' : '#7C3AED'} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function SentenceExercise({ phrase, profile = 'tdah', onComplete }) {
  const [step, setStep] = useState(1)
  const [neuriState, setNeuriState] = useState('idle')
  const [erreurs, setErreurs] = useState(0)

  const settings = config[profile] || config.tdah

  const handleNext = (correct) => {
    if (correct === true) setNeuriState('happy')
    else if (correct === false) setNeuriState('error')
    setTimeout(() => setNeuriState('idle'), 1200)

    if (step >= 4) {
      setTimeout(() => onComplete?.({ erreurs }), 400)
    } else {
      setStep(step + 1)
    }
  }

  const handleErreur = () => setErreurs((e) => e + 1)

  const neuriColor = neuriState === 'happy' ? '#58CC02' : neuriState === 'error' ? '#F59E0B' : '#8B5CF6'

  return (
    <div style={{ minHeight: '100vh', background: '#090E1A', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= step ? '#8B5CF6' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
            ))}
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{step}/4</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <div style={{ width: '64px', height: '64px' }}>
          <Neuri3D color={neuriColor} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && <EtapeExposition phrase={phrase} settings={settings} onNext={() => handleNext(null)} />}
        {step === 2 && <EtapeComprehension phrase={phrase} settings={settings} onNext={handleNext} onErreur={handleErreur} />}
        {step === 3 && <EtapeReconstruction phrase={phrase} settings={settings} onNext={handleNext} onErreur={handleErreur} />}
        {step === 4 && <EtapePhraseTrou phrase={phrase} settings={settings} onNext={handleNext} onErreur={handleErreur} />}
      </div>
    </div>
  )
}

const containerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 20px 32px',
}

const labelStyle = {
  fontFamily: 'DM Sans',
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textAlign: 'center',
  margin: '0 0 24px',
}

const choiceButtonStyle = {
  padding: '18px 20px',
  borderRadius: '16px',
  fontSize: '17px',
  fontWeight: '700',
  fontFamily: 'Nunito',
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
}

const wordChipStyle = (settings, isInResponse) => ({
  background: isInResponse ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
  border: isInResponse ? '1.5px solid rgba(139,92,246,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
  color: '#FFFFFF',
  borderRadius: '12px',
  padding: '12px 18px',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: 'Nunito',
  cursor: 'pointer',
  transition: `all ${settings.transitionMs}ms ease`,
})