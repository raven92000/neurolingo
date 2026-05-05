import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'
import { supabase } from '../supabase'

function ParticlesBg({ active }) {
  const canvasRef = useRef()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.3 + 0.1,
    }))
    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${p.o})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      borderRadius: '22px', opacity: active ? 0.7 : 0.2,
      transition: 'opacity 0.4s ease', pointerEvents: 'none',
    }} />
  )
}

function FluidBg({ active }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT(p => p + 1), 60)
    return () => clearInterval(id)
  }, [])
  const y1 = 60 + Math.sin(t * 0.025) * 8
  const y2 = 50 + Math.cos(t * 0.02) * 10
  return (
    <svg style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      borderRadius: '22px', opacity: active ? 0.6 : 0.15,
      transition: 'opacity 0.4s ease', pointerEvents: 'none',
    }} viewBox="0 0 340 120" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a6e" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#312e81" stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      <path d={`M0,${y1} C80,${y1-14} 160,${y1+12} 240,${y1-8} C300,${y1-18} 330,${y1+8} 340,${y1} L340,120 L0,120 Z`} fill="url(#fg)" opacity="0.5"/>
      <path d={`M0,${y2+22} C90,${y2+6} 180,${y2+26} 260,${y2+10} C310,${y2-2} 330,${y2+16} 340,${y2+22} L340,120 L0,120 Z`} fill="rgba(96,165,250,0.15)"/>
    </svg>
  )
}

function ProgressBar({ etape, total }) {
  return (
    <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', gap: '6px', maxWidth: '340px', margin: '0 auto' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px', background: i < etape ? '#8B5CF6' : 'rgba(255,255,255,0.12)', transition: 'background 0.3s ease' }}/>
      ))}
    </div>
  )
}

// ─── ÉCRAN 1 — PRÉNOM ─────────────────────────────────────────
function EcranPrenom({ nom, setNom, onNext }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', position: 'relative' }}>
      <ProgressBar etape={1} total={5} />
      <div style={{ width: '140px', height: '140px', marginBottom: '24px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '32px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px' }}>
        Comment tu t'appelles ?
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: '0 0 36px' }}>
        Pour qu'on puisse te parler comme il faut.
      </p>
      <input
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && nom.trim().length >= 2 && onNext()}
        placeholder="Ton prénom..."
        autoFocus
        style={{
          width: '100%', maxWidth: '340px', height: '56px',
          background: 'rgba(255,255,255,0.06)',
          border: nom.trim().length >= 2 ? '1.5px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px', padding: '0 20px',
          fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '600',
          color: '#FFFFFF', outline: 'none',
          marginBottom: '16px', boxSizing: 'border-box',
          transition: 'border 0.3s ease',
        }}
      />
      <button
        disabled={nom.trim().length < 2}
        onClick={onNext}
        style={{
          width: '100%', maxWidth: '340px', height: '54px',
          background: nom.trim().length >= 2 ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' : 'rgba(255,255,255,0.05)',
          color: nom.trim().length >= 2 ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
          border: 'none', borderRadius: '18px',
          fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '700',
          cursor: nom.trim().length >= 2 ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          boxShadow: nom.trim().length >= 2 ? '0 0 28px rgba(124,58,237,0.35)' : 'none',
        }}
      >
        Continuer
      </button>
    </div>
  )
}

// ─── ÉCRAN 2 — DATE DE NAISSANCE ──────────────────────────────
function EcranDateNaissance({ dateNaissance, setDateNaissance, onNext, onBack }) {
  // Validation : doit être une date valide, pas dans le futur, et l'utilisateur doit avoir au moins 5 ans
  const isValide = () => {
    if (!dateNaissance) return false
    const date = new Date(dateNaissance)
    const today = new Date()
    if (isNaN(date.getTime())) return false
    if (date > today) return false
    const age = today.getFullYear() - date.getFullYear()
    return age >= 5 && age <= 100
  }

  // Calculer l'âge en direct pour feedback
  const calculerAge = () => {
    if (!dateNaissance) return null
    const today = new Date()
    const birth = new Date(dateNaissance)
    if (isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const age = calculerAge()
  const valide = isValide()

  // Date max = aujourd'hui, date min = il y a 100 ans
  const today = new Date()
  const maxDate = today.toISOString().split('T')[0]
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', position: 'relative' }}>
      <ProgressBar etape={2} total={5} />
      <div style={{ width: '130px', height: '130px', marginBottom: '24px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '30px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px', lineHeight: 1.2 }}>
        Quelle est ta date de naissance ?
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: '0 0 32px', maxWidth: '300px', lineHeight: 1.5 }}>
        Neuri prendra une apparence adaptée à ton âge.
      </p>

      <input
        type="date"
        value={dateNaissance || ''}
        onChange={e => setDateNaissance(e.target.value)}
        max={maxDate}
        min={minDate}
        style={{
          width: '100%', maxWidth: '340px', height: '56px',
          background: 'rgba(255,255,255,0.06)',
          border: valide ? '1.5px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px', padding: '0 20px',
          fontFamily: 'Nunito, sans-serif', fontSize: '17px', fontWeight: '600',
          color: '#FFFFFF', outline: 'none',
          marginBottom: '12px', boxSizing: 'border-box',
          transition: 'border 0.3s ease',
          colorScheme: 'dark'
        }}
      />

      {/* Feedback visuel : âge calculé */}
      <div style={{ minHeight: '24px', marginBottom: '24px' }}>
        {age !== null && valide && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#A78BFA', margin: 0, textAlign: 'center' }}>
            Tu as {age} ans 🎉
          </p>
        )}
        {age !== null && !valide && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F87171', margin: 0, textAlign: 'center' }}>
            {age < 5 ? 'NeuroLingo est conçu pour les 5 ans et plus' : 'Cette date semble incorrecte'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={onBack} style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          disabled={!valide}
          onClick={onNext}
          style={{
            flex: 1, height: '54px',
            background: valide ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' : 'rgba(255,255,255,0.05)',
            color: valide ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
            border: 'none', borderRadius: '18px',
            fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '700',
            cursor: valide ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: valide ? '0 0 28px rgba(124,58,237,0.35)' : 'none',
          }}
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── ÉCRAN 3 — PROFIL ─────────────────────────────────────────
function EcranProfil({ profil, setProfil, onNext, onBack }) {
  const neurColor = profil === 'tdah' ? '#8B5CF6' : profil === 'dyslexie' ? '#3B82F6' : '#7C3AED'
  const bgGradient = profil === 'tdah'
    ? 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.22) 0%, #090E1A 55%)'
    : profil === 'dyslexie'
    ? 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.18) 0%, #090E1A 55%)'
    : 'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.12) 0%, #090E1A 55%)'

  return (
    <div style={{ minHeight: '100vh', background: bgGradient, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', transition: 'background 0.8s ease', overflow: 'hidden', position: 'relative' }}>
      <ProgressBar etape={3} total={5} />
      <div style={{ width: '150px', height: '150px', transition: 'transform 0.4s ease', transform: profil ? 'scale(1.06)' : 'scale(1)', marginBottom: '20px' }}>
        <Neuri3D color={neurColor} />
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '34px', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px', lineHeight: '1.15' }}>
        Je m'adapte à toi.
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '17px', fontWeight: '400', color: 'rgba(255,255,255,0.65)', textAlign: 'center', margin: '0 0 36px', lineHeight: '1.5' }}>
        {profil ? 'Parfait. On continue.' : 'Chaque cerveau apprend différemment.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '340px', marginBottom: '32px' }}>
        <div onClick={() => setProfil('tdah')} style={{ position: 'relative', overflow: 'hidden', borderRadius: '22px', padding: '22px 20px', cursor: 'pointer', background: profil === 'tdah' ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: profil === 'tdah' ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)', boxShadow: profil === 'tdah' ? '0 0 32px rgba(139,92,246,0.22)' : '0 2px 20px rgba(0,0,0,0.25)', transform: profil === 'tdah' ? 'scale(1.025)' : profil === 'dyslexie' ? 'scale(0.98)' : 'scale(1)', opacity: profil === 'dyslexie' ? 0.75 : 1, transition: 'all 0.2s ease' }}>
          <ParticlesBg active={profil === 'tdah'} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M1 11 L5 5 L8 14 L12 3 L15 13 L18 7 L21 11" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '21px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 5px' }}>TDAH</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: '1.4' }}>Rythme rapide · Visuel · Récompenses fréquentes</p>
            </div>
            {profil === 'tdah' && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        </div>

        <div onClick={() => setProfil('dyslexie')} style={{ position: 'relative', overflow: 'hidden', borderRadius: '22px', padding: '22px 20px', cursor: 'pointer', background: profil === 'dyslexie' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: profil === 'dyslexie' ? '1.5px solid rgba(59,130,246,0.55)' : '1px solid rgba(255,255,255,0.08)', boxShadow: profil === 'dyslexie' ? '0 0 32px rgba(59,130,246,0.2)' : '0 2px 20px rgba(0,0,0,0.25)', transform: profil === 'dyslexie' ? 'scale(1.025)' : profil === 'tdah' ? 'scale(0.98)' : 'scale(1)', opacity: profil === 'tdah' ? 0.75 : 1, transition: 'all 0.25s ease' }}>
          <FluidBg active={profil === 'dyslexie'} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="2.5" fill="#60A5FA"/>
                <path d="M5.5 11 C5.5 7.96 7.96 5.5 11 5.5 C14.04 5.5 16.5 7.96 16.5 11 C16.5 14.04 14.04 16.5 11 16.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '21px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 5px' }}>Dyslexie</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: '1.4' }}>Lecture simplifiée · Audio · Confort visuel</p>
            </div>
            {profil === 'dyslexie' && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={onBack} style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button disabled={!profil} onClick={onNext} style={{ flex: 1, height: '54px', background: profil ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' : 'rgba(255,255,255,0.05)', color: profil ? '#FFFFFF' : 'rgba(255,255,255,0.25)', border: profil ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '600', cursor: profil ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', opacity: profil ? 1 : 0.5, boxShadow: profil ? '0 0 28px rgba(124,58,237,0.35)' : 'none', letterSpacing: '0.02em' }}>
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── ÉCRAN 4 — LANGUE ─────────────────────────────────────────
function EcranLangue({ langue, setLangue, onNext, onBack }) {
  const langues = [
    { code: 'en', nom: 'Anglais', emoji: '🇬🇧', dispo: true },
    { code: 'es', nom: 'Espagnol', emoji: '🇪🇸', dispo: false },
    { code: 'de', nom: 'Allemand', emoji: '🇩🇪', dispo: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', position: 'relative' }}>
      <ProgressBar etape={4} total={5} />
      <div style={{ width: '120px', height: '120px', marginBottom: '20px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '32px', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px', lineHeight: '1.15' }}>
        Quelle langue veux-tu apprendre ?
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 32px' }}>
        On commence par une seule, on en ajoutera d'autres plus tard.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px', marginBottom: '32px' }}>
        {langues.map(l => (
          <div key={l.code} onClick={() => l.dispo && setLangue(l.code)} style={{ borderRadius: '18px', padding: '18px 20px', cursor: l.dispo ? 'pointer' : 'not-allowed', background: langue === l.code ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)', border: langue === l.code ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)', opacity: l.dispo ? 1 : 0.4, transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '32px' }}>{l.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '19px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>{l.nom}</p>
              {!l.dispo && (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Bientôt disponible</p>
              )}
            </div>
            {langue === l.code && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={onBack} style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button disabled={!langue} onClick={onNext} style={{ flex: 1, height: '54px', background: langue ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' : 'rgba(255,255,255,0.05)', color: langue ? '#FFFFFF' : 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '18px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '600', cursor: langue ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', boxShadow: langue ? '0 0 28px rgba(124,58,237,0.35)' : 'none' }}>
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── ÉCRAN 5 — OBJECTIF (TDAH) ────────────────────────────────
function EcranObjectifTDAH({ objectif, setObjectif, onFinish, onBack, sauvegarde }) {
  const objectifs = [
  { min: 5, label: 'Tranquille', desc: '5 mots par session', emoji: '🌱' },
  { min: 10, label: 'Intense', desc: '10 mots par session', emoji: '🔥' },
]

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', position: 'relative' }}>
      <ProgressBar etape={5} total={5} />
      <div style={{ width: '120px', height: '120px', marginBottom: '20px' }}>
        <Neuri3D color="#8B5CF6" />
      </div>
      <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '32px', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', margin: '0 0 8px', lineHeight: '1.15' }}>
        On part sur quel rythme ?
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 32px' }}>
        Tu pourras changer ça plus tard.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px', marginBottom: '32px' }}>
        {objectifs.map(o => (
          <div key={o.min} onClick={() => setObjectif(o.min)} style={{ borderRadius: '18px', padding: '16px 20px', cursor: 'pointer', background: objectif === o.min ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)', border: objectif === o.min ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {o.emoji && <div style={{ fontSize: '28px' }}>{o.emoji}</div>}
            <div style={{ flex: 1, marginLeft: o.emoji ? 0 : '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>{o.min} min</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>· {o.label}</p>
              </div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{o.desc}</p>
            </div>
            {objectif === o.min && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={onBack} disabled={sauvegarde} style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '18px', cursor: sauvegarde ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sauvegarde ? 0.5 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button disabled={!objectif || sauvegarde} onClick={onFinish} style={{ flex: 1, height: '54px', background: objectif && !sauvegarde ? 'linear-gradient(135deg, #58CC02 0%, #3DAD00 100%)' : 'rgba(255,255,255,0.05)', color: objectif && !sauvegarde ? '#FFFFFF' : 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '18px', fontSize: '17px', fontFamily: 'Nunito, sans-serif', fontWeight: '700', cursor: objectif && !sauvegarde ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', boxShadow: objectif && !sauvegarde ? '0 0 28px rgba(88,204,2,0.35)' : 'none' }}>
          {sauvegarde ? 'Création...' : "C'est parti !"}
        </button>
      </div>
    </div>
  )
}

// ─── ÉCRAN 5 — OBJECTIF (DYSLEXIE) ────────────────────────────
function EcranObjectifDyslexie({ objectif, setObjectif, onFinish, onBack, sauvegarde }) {
  const objectifs = [
  { min: 5, label: '5 mots par session' },
  { min: 10, label: '10 mots par session' },
]

  const fontDyslexie = { fontFamily: 'Atkinson Hyperlegible, sans-serif', letterSpacing: '0.05em', lineHeight: 1.7 }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.18) 0%, #090E1A 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 22px 32px', position: 'relative' }}>
      <ProgressBar etape={5} total={5} />
      <div style={{ width: '120px', height: '120px', marginBottom: '32px' }}>
        <Neuri3D color="#3B82F6" />
      </div>
      <h1 style={{ ...fontDyslexie, fontSize: '34px', fontWeight: '700', color: '#FFFFFF', textAlign: 'center', margin: '0 0 40px' }}>
        Ton rythme
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '340px', marginBottom: '40px' }}>
        {objectifs.map(o => (
          <div key={o.min} onClick={() => setObjectif(o.min)} style={{ borderRadius: '20px', padding: '24px 24px', cursor: 'pointer', background: objectif === o.min ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.04)', border: objectif === o.min ? '1.5px solid rgba(59,130,246,0.55)' : '1px solid rgba(255,255,255,0.08)', transition: 'background 0.4s ease, border 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <p style={{ ...fontDyslexie, fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>{o.min} min</p>
              <p style={{ ...fontDyslexie, fontSize: '20px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>— {o.label}</p>
            </div>
            {objectif === o.min && (
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 11 11" fill="none"><path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={onBack} disabled={sauvegarde} style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '18px', cursor: sauvegarde ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sauvegarde ? 0.5 : 1 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button disabled={!objectif || sauvegarde} onClick={onFinish} style={{ ...fontDyslexie, flex: 1, height: '60px', background: objectif && !sauvegarde ? 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' : 'rgba(255,255,255,0.05)', color: objectif && !sauvegarde ? '#FFFFFF' : 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '18px', fontSize: '18px', fontWeight: '700', cursor: objectif && !sauvegarde ? 'pointer' : 'not-allowed', transition: 'all 0.4s ease', boxShadow: objectif && !sauvegarde ? '0 0 28px rgba(37,99,235,0.35)' : 'none' }}>
          {sauvegarde ? 'Création...' : 'Commencer'}
        </button>
      </div>
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1)
  const [nom, setNom] = useState('')
  const [dateNaissance, setDateNaissance] = useState(null)
  const [profil, setProfil] = useState(null)
  const [langue, setLangue] = useState(null)
  const [objectif, setObjectif] = useState(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  const handleFinish = async () => {
    setSauvegarde(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      await supabase.from('profils').update({
        nom: nom.trim(),
        date_naissance: dateNaissance,
        profil_type: profil,
        langue_id: langue,
        objectif_minutes: objectif,
      }).eq('user_id', user.id)

      navigate('/dashboard')
    } catch (e) {
      console.error('Erreur sauvegarde onboarding:', e)
      setSauvegarde(false)
    }
  }

  if (etape === 1) return <EcranPrenom nom={nom} setNom={setNom} onNext={() => setEtape(2)} />
  if (etape === 2) return <EcranDateNaissance dateNaissance={dateNaissance} setDateNaissance={setDateNaissance} onNext={() => setEtape(3)} onBack={() => setEtape(1)} />
  if (etape === 3) return <EcranProfil profil={profil} setProfil={setProfil} onNext={() => setEtape(4)} onBack={() => setEtape(2)} />
  if (etape === 4) return <EcranLangue langue={langue} setLangue={setLangue} onNext={() => setEtape(5)} onBack={() => setEtape(3)} />

  if (profil === 'dyslexie') {
    return <EcranObjectifDyslexie objectif={objectif} setObjectif={setObjectif} onFinish={handleFinish} onBack={() => setEtape(4)} sauvegarde={sauvegarde} />
  }
  return <EcranObjectifTDAH objectif={objectif} setObjectif={setObjectif} onFinish={handleFinish} onBack={() => setEtape(4)} sauvegarde={sauvegarde} />
}