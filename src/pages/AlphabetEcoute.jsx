import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLangueByCode } from '../utils/languages'
import { ALPHABET_DATA } from '../data/alphabetData'
import Neuri3D from '../components/Neuri3D'

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

function shuffle(arr) {
  const copie = [...arr]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

function genererPartie() {
  const toutesLesLettres = ALPHABET_DATA.en.map((item) => item.lettre)
  const cibles = shuffle(toutesLesLettres).slice(0, 10)
  return cibles.map((lettre) => {
    const candidats = toutesLesLettres.filter((l) => l !== lettre)
    const distracteurs = shuffle(candidats).slice(0, 2)
    const cartes = shuffle([lettre, ...distracteurs])
    return { lettre, cartes }
  })
}

export default function AlphabetEcoute() {
  const navigate = useNavigate()
  const langue = getLangueByCode('en')

  const [partie, setPartie] = useState(genererPartie)
  const [questionActuelle, setQuestionActuelle] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [lettreChoisie, setLettreChoisie] = useState(null)
  const [voix, setVoix] = useState(null)
  const [termine, setTermine] = useState(false)
  const [showNeuri, setShowNeuri] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [countdown, setCountdown] = useState(null)

  const audioCtxRef = useRef(null)
  const countdownRef = useRef(null)
  const autoContinueRef = useRef(null)

  // Chargement de la voix anglaise (dupliqué depuis Alphabet.jsx)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    function chargerVoix() {
      const liste = window.speechSynthesis.getVoices()
      const langExact = TTS_MAP.en
      let trouvee = liste.find((v) => v.lang === langExact)
      if (!trouvee) {
        trouvee = liste.find((v) => v.lang.toLowerCase().startsWith('en'))
      }
      if (trouvee) setVoix(trouvee)
    }

    chargerVoix()
    window.speechSynthesis.addEventListener('voiceschanged', chargerVoix)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', chargerVoix)
    }
  }, [])

  // Lecture automatique de la lettre cible à chaque question
  // (500ms uniforme — laisse charger la voix au début + respiration entre questions)
  useEffect(() => {
    if (termine) return
    if (!voix) return
    if (!partie[questionActuelle]) return
    const t = setTimeout(() => {
      playLetter(partie[questionActuelle].lettre, 'en', voix)
    }, 500)
    return () => clearTimeout(t)
  }, [voix, questionActuelle, partie, termine])

  // Cleanup AudioContext + intervalle countdown + auto-continue au unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close()
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      if (autoContinueRef.current) {
        clearTimeout(autoContinueRef.current)
        autoContinueRef.current = null
      }
    }
  }, [])

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext
      if (!AudioCtor) return null
      audioCtxRef.current = new AudioCtor()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  function jouerBeep(frequence, dureeMs) {
    const ctx = getAudioCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequence
    gain.gain.value = 0.1
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dureeMs / 1000)
    osc.stop(ctx.currentTime + dureeMs / 1000)
  }

  function jouerSonCorrect() { jouerBeep(800, 150) }
  function jouerSonWrong() { jouerBeep(200, 250) }

  function rejouerSon() {
    if (termine) return
    if (!partie[questionActuelle]) return
    playLetter(partie[questionActuelle].lettre, 'en', voix)
  }

  function startCountdown(seconds) {
    setCountdown(seconds)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
          setShowContinue(true)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function repondre(lettre) {
    if (feedback !== null) return
    if (termine) return

    const cible = partie[questionActuelle].lettre
    const correct = lettre === cible

    setLettreChoisie(lettre)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      setScore((s) => s + 1)
      jouerSonCorrect()
    } else {
      jouerSonWrong()
    }

    setTimeout(() => setShowNeuri(true), 400)

    if (correct) {
      // Auto-continue : on enchaîne sans afficher de bouton ni countdown.
      autoContinueRef.current = setTimeout(() => {
        passerQuestionSuivante()
      }, 1500)
    } else {
      // Mauvaise réponse : countdown + bouton Continuer manuel.
      startCountdown(3)
    }
  }

  function passerQuestionSuivante() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (autoContinueRef.current) {
      clearTimeout(autoContinueRef.current)
      autoContinueRef.current = null
    }
    const suivante = questionActuelle + 1
    if (suivante >= partie.length) {
      setTermine(true)
    } else {
      setQuestionActuelle(suivante)
    }
    setLettreChoisie(null)
    setFeedback(null)
    setShowNeuri(false)
    setShowContinue(false)
    setCountdown(null)
  }

  function onContinuer() {
    if (!showContinue) return
    passerQuestionSuivante()
  }

  function rejouerPartie() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (autoContinueRef.current) {
      clearTimeout(autoContinueRef.current)
      autoContinueRef.current = null
    }
    setPartie(genererPartie())
    setQuestionActuelle(0)
    setScore(0)
    setFeedback(null)
    setLettreChoisie(null)
    setTermine(false)
    setShowNeuri(false)
    setShowContinue(false)
    setCountdown(null)
  }

  if (termine) {
    return <EcranFin score={score} total={partie.length} onRetour={() => navigate('/learn')} onExerciceSuivant={() => navigate('/alphabet/chanson')} onRejouer={rejouerPartie} />
  }

  const question = partie[questionActuelle]
  const progression = (questionActuelle / partie.length) * 100

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
            Écoute et choisis
          </h1>
        </div>
      </div>

      {/* Bandeau score + barre de progression */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>
            Score : {score}
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
            {questionActuelle + 1} / {partie.length}
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progression}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Carte audio — gros bouton rond */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={rejouerSon}
          aria-label="Rejouer la lettre"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 32px rgba(139,92,246,0.4)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M10 18 L18 18 L26 12 L26 36 L18 30 L10 30 Z" fill="#FFFFFF"/>
            <path d="M32 18 Q36 24 32 30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M36 14 Q42 24 36 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center' }}>
          Quelle lettre as-tu entendue&nbsp;?
        </p>
      </div>

      {/* 3 cartes-réponses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {question.cartes.map((lettre) => {
          const isSelected = lettreChoisie === lettre
          const isCorrect = feedback && lettre === question.lettre
          const isWrong = feedback === 'wrong' && isSelected && lettre !== question.lettre

          return (
            <button
              key={lettre}
              onClick={() => repondre(lettre)}
              disabled={feedback !== null}
              aria-label={lettre}
              style={{
                aspectRatio: '1',
                background: isCorrect ? 'rgba(88,204,2,0.1)' : isWrong ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                border: isCorrect ? '2px solid rgba(88,204,2,0.5)' : isWrong ? '2px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                borderRadius: '18px',
                fontSize: '40px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: '900',
                color: isCorrect ? '#86EFAC' : isWrong ? '#FCD34D' : '#FFFFFF',
                cursor: feedback !== null ? 'default' : 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 0 16px rgba(139,92,246,0.05)',
              }}
              onMouseDown={(e) => {
                if (feedback !== null) return
                e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {lettre}
            </button>
          )
        })}
      </div>

      {/* Bloc Neuri 3D + bulle (apparaît 400ms après la réponse) */}
      {showNeuri && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', flexShrink: 0 }}>
            <Neuri3D color={feedback === 'correct' ? '#58CC02' : '#8B5CF6'} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 14px', flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
              {feedback === 'correct' ? 'Bien joué !' : `Presque ! C'était ${question.lettre}.`}
            </p>
          </div>
        </div>
      )}

      {/* Bloc countdown + bouton Continuer (uniquement en cas de mauvaise réponse) */}
      {feedback === 'wrong' && (
        <div style={{ width: '100%' }}>
          {countdown !== null && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: '0 0 6px', textAlign: 'center' }}>
                Continuer dans {countdown}...
              </p>
              <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: feedback === 'correct' ? '#58CC02' : '#8B5CF6',
                  borderRadius: '99px',
                  animation: `shrink 3s linear forwards`,
                  transformOrigin: 'left',
                }}/>
              </div>
            </div>
          )}
          <button
            onClick={onContinuer}
            disabled={!showContinue}
            style={{
              width: '100%',
              height: '54px',
              background: !showContinue ? 'rgba(255,255,255,0.06)' : feedback === 'correct' ? 'linear-gradient(135deg, #58CC02, #3DAD00)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: !showContinue ? 'rgba(255,255,255,0.25)' : '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '17px',
              fontWeight: '800',
              cursor: showContinue ? 'pointer' : 'not-allowed',
              transition: 'all 0.4s ease',
            }}
          >
            Continuer
          </button>
          {feedback === 'wrong' && (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '12px 0 0' }}>
              Chaque erreur te fait progresser.
            </p>
          )}
        </div>
      )}

      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  )
}

function EcranFin({ score, total, onRetour, onExerciceSuivant, onRejouer }) {
  const pourcentage = Math.round((score / total) * 100)

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
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 32px' }}>
        Tu as bien écouté l'alphabet
      </p>
      <div style={{ display: 'flex', gap: '14px', marginBottom: '32px', width: '100%' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '26px', fontWeight: '900', color: '#58CC02', margin: '0 0 4px' }}>{score} / {total}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Score</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '26px', fontWeight: '900', color: '#8B5CF6', margin: '0 0 4px' }}>{pourcentage}%</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Réussite</p>
        </div>
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
        onClick={onExerciceSuivant}
        style={{
          width: '100%',
          height: '48px',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '14px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        🎵 Exercice suivant : Chantons l'alphabet
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
