import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Neuri3D from '../components/Neuri3D'

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

export default function Onboarding() {
  const [profil, setProfil] = useState(null)
  const navigate = useNavigate()

  const neurColor = profil === 'tdah' ? '#8B5CF6' : profil === 'dyslexie' ? '#3B82F6' : '#7C3AED'

  const bgGradient = profil === 'tdah'
    ? 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.22) 0%, #090E1A 55%)'
    : profil === 'dyslexie'
    ? 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.18) 0%, #090E1A 55%)'
    : 'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.12) 0%, #090E1A 55%)'

  return (
    <div style={{
      minHeight: '100vh',
      background: bgGradient,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 22px',
      transition: 'background 0.8s ease',
      overflow: 'hidden',
    }}>

      <div style={{
        width: '150px', height: '150px',
        transition: 'transform 0.4s ease',
        transform: profil ? 'scale(1.06)' : 'scale(1)',
        marginBottom: '20px',
      }}>
        <Neuri3D color={neurColor} />
      </div>

      <h1 style={{
        fontFamily: 'Nunito, sans-serif',
        fontSize: '34px',
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        margin: '0 0 8px',
        lineHeight: '1.15',
      }}>
        Je m'adapte à toi.
      </h1>

      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '17px',
        fontWeight: '400',
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        margin: '0 0 36px',
        lineHeight: '1.5',
      }}>
        {profil ? 'Parfait. Je construis ton parcours.' : 'Chaque cerveau apprend différemment.'}
      </p>

      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: '16px', width: '100%', maxWidth: '340px',
        marginBottom: '32px',
      }}>

        {/* CARTE TDAH */}
        <div
          onClick={() => setProfil('tdah')}
          style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '22px', padding: '22px 20px',
            cursor: 'pointer',
            background: profil === 'tdah' ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: profil === 'tdah' ? '1.5px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: profil === 'tdah' ? '0 0 32px rgba(139,92,246,0.22)' : '0 2px 20px rgba(0,0,0,0.25)',
            transform: profil === 'tdah' ? 'scale(1.025)' : profil === 'dyslexie' ? 'scale(0.98)' : 'scale(1)',
            opacity: profil === 'dyslexie' ? 0.75 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <ParticlesBg active={profil === 'tdah'} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M1 11 L5 5 L8 14 L12 3 L15 13 L18 7 L21 11" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '21px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 5px' }}>TDAH</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: '1.4' }}>
                Rythme rapide · Visuel · Récompenses fréquentes
              </p>
            </div>
            {profil === 'tdah' && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* CARTE DYSLEXIE */}
        <div
          onClick={() => setProfil('dyslexie')}
          style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '22px', padding: '22px 20px',
            cursor: 'pointer',
            background: profil === 'dyslexie' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: profil === 'dyslexie' ? '1.5px solid rgba(59,130,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: profil === 'dyslexie' ? '0 0 32px rgba(59,130,246,0.2)' : '0 2px 20px rgba(0,0,0,0.25)',
            transform: profil === 'dyslexie' ? 'scale(1.025)' : profil === 'tdah' ? 'scale(0.98)' : 'scale(1)',
            opacity: profil === 'tdah' ? 0.75 : 1,
            transition: 'all 0.25s ease',
          }}
        >
          <FluidBg active={profil === 'dyslexie'} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="2.5" fill="#60A5FA"/>
                <path d="M5.5 11 C5.5 7.96 7.96 5.5 11 5.5 C14.04 5.5 16.5 7.96 16.5 11 C16.5 14.04 14.04 16.5 11 16.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '21px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 5px' }}>Dyslexie</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: '1.4' }}>
                Lecture simplifiée · Audio · Confort visuel
              </p>
            </div>
            {profil === 'dyslexie' && (
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5 L4.5 8 L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CTA */}
      <button
        disabled={!profil}
        onClick={() => navigate('/dashboard')}
        style={{
          width: '100%', maxWidth: '340px',
          height: '54px',
          background: profil ? 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' : 'rgba(255,255,255,0.05)',
          color: profil ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
          border: profil ? 'none' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          fontSize: '17px',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: '600',
          cursor: profil ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          opacity: profil ? 1 : 0.5,
          boxShadow: profil ? '0 0 28px rgba(124,58,237,0.35)' : 'none',
          letterSpacing: '0.02em',
        }}
      >
        Créer mon parcours
      </button>

    </div>
  )
}